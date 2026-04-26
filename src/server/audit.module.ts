import { BadRequestException, Body, Controller, Get, Inject, Injectable, Module, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import type { AuditLog } from "../types";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";

class CreateAuditDto {
  @IsString() userId!: string;
  @IsString() userName!: string;
  @IsString() action!: string;
  @IsString() target!: string;
}

@Injectable()
class AuditService {
  private fallback: AuditLog[] = [];
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async list() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("audit_logs").select("*").order("timestamp", { ascending: false });
      if (!error && data) return data;
    }
    return this.fallback;
  }

  async create(dto: CreateAuditDto) {
    const payload: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...dto,
    };
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("audit_logs").insert([payload]).select().single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }
    this.fallback.unshift(payload);
    return payload;
  }
}

@Controller("api/audit")
@UseGuards(AuthGuard, RolesGuard)
class AuditController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get()
  @Roles("admin")
  async list() {
    return wrap(await this.audit.list());
  }

  @Post()
  @Roles("admin", "dept_head", "payroll_officer")
  async create(@Body() dto: CreateAuditDto) {
    return wrap(await this.audit.create(dto));
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
