import { Controller, Get, Inject, Injectable, Module, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { Roles } from "./common/roles";
import { RolesGuard } from "./common/roles.guard";
import { SupabaseService } from "./supabase.service";

@Injectable()
class ReportsService {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async summary() {
    const client = this.supabase.getClient();
    if (!client) {
      return {
        employees: 0,
        pendingLeave: 0,
        attendanceToday: 0,
        payrollThisMonth: 0,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);

    const [{ count: employees }, { count: pendingLeave }, { count: attendanceToday }, { data: payroll }] = await Promise.all([
      client.from("employees").select("*", { count: "exact", head: true }),
      client.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      client.from("attendance_records").select("*", { count: "exact", head: true }).eq("date", today),
      client.from("payroll").select("netPay,period").like("period", `${currentMonth}%`),
    ]);

    const payrollThisMonth = (payroll ?? []).reduce((sum, entry: any) => sum + Number(entry.netPay || 0), 0);
    return { employees: employees ?? 0, pendingLeave: pendingLeave ?? 0, attendanceToday: attendanceToday ?? 0, payrollThisMonth };
  }
}

@Controller("api/reports")
@UseGuards(AuthGuard, RolesGuard)
class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Get("summary")
  @Roles("admin", "dept_head", "payroll_officer")
  async getSummary() {
    return wrap(await this.reports.summary());
  }
}

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
