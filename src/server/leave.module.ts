import { BadRequestException, Body, Controller, Get, Injectable, Module, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsEnum, IsOptional, IsString } from "class-validator";
import type { LeaveRequest } from "../types";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";

class CreateLeaveDto {
  @IsString() employeeId!: string;
  @IsEnum(["Vacation", "Sick", "Maternity", "Paternity", "Emergency"]) type!: LeaveRequest["type"];
  @IsString() startDate!: string;
  @IsString() endDate!: string;
  @IsString() reason!: string;
}

class UpdateLeaveStatusDto {
  @IsEnum(["approved", "rejected"]) status!: "approved" | "rejected";
  @IsOptional() @IsString() remarks?: string;
}

@Injectable()
class LeaveService {
  private fallback: LeaveRequest[] = [];
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").select("*").order("requestedAt", { ascending: false });
      if (!error && data) return data;
    }
    return this.fallback;
  }

  async create(dto: CreateLeaveDto) {
    const payload: LeaveRequest = {
      id: `LV-${Date.now()}`,
      ...dto,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").insert([payload]).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    this.fallback.unshift(payload);
    return payload;
  }

  async updateStatus(id: string, dto: UpdateLeaveStatusDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").update(dto).eq("id", id).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    const index = this.fallback.findIndex((entry) => entry.id === id);
    if (index < 0) throw new BadRequestException("Leave request not found");
    this.fallback[index] = { ...this.fallback[index], ...dto };
    return this.fallback[index];
  }
}

@Controller("api/leave")
@UseGuards(AuthGuard, RolesGuard)
class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Get()
  @Roles("admin", "dept_head", "employee", "payroll_officer")
  async list() {
    return wrap(await this.leave.list());
  }

  @Post()
  @Roles("admin", "dept_head", "employee")
  async create(@Body() dto: CreateLeaveDto) {
    return wrap(await this.leave.create(dto), "Leave request submitted");
  }

  @Put(":id/status")
  @Roles("admin", "dept_head")
  async update(@Param("id") id: string, @Body() dto: UpdateLeaveStatusDto) {
    return wrap(await this.leave.updateStatus(id, dto), "Leave request updated");
  }
}

@Module({
  controllers: [LeaveController],
  providers: [LeaveService],
})
export class LeaveModule {}
