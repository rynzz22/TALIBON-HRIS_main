import { BadRequestException, Body, Controller, Get, Inject, Injectable, Module, Post, UseGuards } from "@nestjs/common";
import { IsEnum, IsString } from "class-validator";
import type { AttendanceRecord } from "../types";
import { AuthGuard, type AuthenticatedRequest } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";
import { Req } from "@nestjs/common";

class AttendanceLogDto {
  @IsString() employeeId!: string;
  @IsEnum(["in", "out"]) type!: "in" | "out";
  @IsString() date!: string;
  @IsString() time!: string;
}

@Injectable()
class AttendanceService {
  private fallback: AttendanceRecord[] = [];
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async list() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("attendance_records").select("*").order("date", { ascending: false });
      if (!error && data) return data;
    }
    return this.fallback;
  }

  async log(dto: AttendanceLogDto) {
    const client = this.supabase.getClient();
    if (dto.type === "in") {
      const created: AttendanceRecord = {
        id: `ATT-${Date.now()}`,
        employeeId: dto.employeeId,
        date: dto.date,
        timeIn: dto.time,
        totalHours: 0,
        status: "present",
      };
      if (client) {
        const { data, error } = await client.from("attendance_records").insert([created]).select().single();
        if (error) throw new BadRequestException(error.message);
        return data;
      }
      this.fallback.unshift(created);
      return created;
    }

    if (client) {
      const { data: latest } = await client
        .from("attendance_records")
        .select("*")
        .eq("employeeId", dto.employeeId)
        .eq("date", dto.date)
        .is("timeOut", null)
        .order("timeIn", { ascending: false })
        .limit(1);
      const open = latest?.[0];
      if (!open) throw new BadRequestException("No open time-in record");
      const hours = (new Date(dto.time).getTime() - new Date(open.timeIn).getTime()) / 36e5;
      const { data, error } = await client
        .from("attendance_records")
        .update({ timeOut: dto.time, totalHours: Math.max(0, Number(hours.toFixed(2))) })
        .eq("id", open.id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const openIndex = this.fallback.findIndex((entry) => entry.employeeId === dto.employeeId && entry.date === dto.date && !entry.timeOut);
    if (openIndex < 0) throw new BadRequestException("No open time-in record");
    const hours = (new Date(dto.time).getTime() - new Date(this.fallback[openIndex].timeIn).getTime()) / 36e5;
    this.fallback[openIndex] = {
      ...this.fallback[openIndex],
      timeOut: dto.time,
      totalHours: Math.max(0, Number(hours.toFixed(2))),
    };
    return this.fallback[openIndex];
  }
}

@Controller("api/attendance")
@UseGuards(AuthGuard, RolesGuard)
class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendance: AttendanceService) {}

  @Get()
  @Roles("admin", "dept_head", "employee", "payroll_officer")
  async list() {
    return wrap(await this.attendance.list());
  }

  @Post("log")
  @Roles("admin", "dept_head", "employee")
  async log(@Body() dto: AttendanceLogDto, @Req() req: AuthenticatedRequest) {
    const employeeScopedDto = req.user?.role === "employee" ? { ...dto, employeeId: req.user.userId } : dto;
    return wrap(await this.attendance.log(employeeScopedDto));
  }
}

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
