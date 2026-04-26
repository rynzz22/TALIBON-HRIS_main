import { BadRequestException, Body, Controller, Get, Injectable, Module, Post, UseGuards } from "@nestjs/common";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import type { PayrollRecord } from "../types";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";

class CreatePayrollDto {
  @IsString() employeeId!: string;
  @IsString() period!: string;
  @IsNumber() basicSalary!: number;
  @IsOptional() allowances?: PayrollRecord["allowances"];
  @IsOptional() deductions?: PayrollRecord["deductions"];
  @IsNumber() overtimePay!: number;
  @IsNumber() grossPay!: number;
  @IsNumber() netPay!: number;
  @IsEnum(["pending", "approved", "paid"]) status!: PayrollRecord["status"];
}

@Injectable()
class PayrollService {
  private fallback: PayrollRecord[] = [];
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("payroll").select("*").order("period", { ascending: false });
      if (!error && data) return data;
    }
    return this.fallback;
  }

  async create(dto: CreatePayrollDto) {
    const payload: PayrollRecord = {
      id: `PAY-${Date.now()}`,
      ...dto,
      processedAt: new Date().toISOString(),
      allowances: dto.allowances ?? {},
      deductions: dto.deductions ?? { sss: 0, philhealth: 0, pagibig: 0, tax: 0, latePenalty: 0 },
    };
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("payroll").insert([payload]).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    this.fallback.unshift(payload);
    return payload;
  }
}

@Controller("api/payroll")
@UseGuards(AuthGuard, RolesGuard)
class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get()
  @Roles("admin", "payroll_officer")
  async list() {
    return wrap(await this.payroll.list());
  }

  @Post()
  @Roles("admin", "payroll_officer")
  async create(@Body() dto: CreatePayrollDto) {
    return wrap(await this.payroll.create(dto), "Payroll record generated");
  }
}

@Module({
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
