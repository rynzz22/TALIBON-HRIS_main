import { BadRequestException, Body, Controller, Delete, Get, Inject, Injectable, Module, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import type { Department, Employee, Role } from "../types";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";

class CreateEmployeeDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsString() department!: Department;
  @IsString() position!: string;
  @IsNumber() salary!: number;
  @IsString() hireDate!: string;
  @IsEnum(["admin", "dept_head", "employee", "payroll_officer"]) role!: Role;
  @IsEnum(["Regular", "Casual", "Contractual"]) employmentStatus!: "Regular" | "Casual" | "Contractual";
}

class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() department?: Department;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsNumber() salary?: number;
}

@Injectable()
class EmployeeService {
  private fallback: Employee[] = [];
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("employees").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    }
    return this.fallback;
  }

  async create(dto: CreateEmployeeDto) {
    const record = { ...dto, status: "active", govIds: {}, leaveBalances: { vacation: 15, sick: 15, emergency: 5 } };
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("employees").insert([record]).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    const created = { id: `EMP-${Date.now()}`, ...record } as Employee;
    this.fallback.unshift(created);
    return created;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("employees").update(dto).eq("id", id).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    const index = this.fallback.findIndex((entry) => entry.id === id);
    if (index < 0) throw new BadRequestException("Employee not found");
    this.fallback[index] = { ...this.fallback[index], ...dto };
    return this.fallback[index];
  }

  async remove(id: string) {
    const client = this.supabase.getClient();
    if (client) {
      const { error } = await client.from("employees").delete().eq("id", id);
      if (error) throw new BadRequestException(error.message);
      return;
    }
    this.fallback = this.fallback.filter((entry) => entry.id !== id);
  }
}

@Controller("api/employees")
@UseGuards(AuthGuard, RolesGuard)
class EmployeeController {
  constructor(@Inject(EmployeeService) private readonly employees: EmployeeService) {}

  @Get()
  @Roles("admin", "dept_head", "payroll_officer")
  async list() {
    return wrap(await this.employees.findAll());
  }

  @Post()
  @Roles("admin", "dept_head")
  async create(@Body() dto: CreateEmployeeDto) {
    return wrap(await this.employees.create(dto), "Employee profile created");
  }

  @Put(":id")
  @Roles("admin", "dept_head")
  async update(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    return wrap(await this.employees.update(id, dto), "Employee profile updated");
  }

  @Delete(":id")
  @Roles("admin")
  async remove(@Param("id") id: string) {
    await this.employees.remove(id);
    return wrap(null, "Employee record deleted");
  }
}

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeesModule {}
