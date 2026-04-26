import { Module, ValidationPipe } from "@nestjs/common";
import { APP_GUARD, APP_PIPE, Reflector } from "@nestjs/core";
import { AttendanceModule } from "./attendance.module";
import { AuditModule } from "./audit.module";
import { AuthModule } from "./auth/auth.module";
import { EmployeesModule } from "./employees.module";
import { LeaveModule } from "./leave.module";
import { NotificationsModule } from "./notifications.module";
import { PayrollModule } from "./payroll.module";
import { ReportsModule } from "./reports.module";
import { RolesGuard } from "./common/roles.guard";
import { AuthGuard } from "./common/auth.guard";
import { SupabaseService } from "./supabase.service";

@Module({
  imports: [AuthModule, EmployeesModule, AttendanceModule, LeaveModule, PayrollModule, ReportsModule, AuditModule, NotificationsModule],
  providers: [
    SupabaseService,
    Reflector,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    },
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
