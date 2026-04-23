import "reflect-metadata";
import express from "express";
import { NestFactory } from "@nestjs/core";
import { 
  Module, 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Injectable, 
  Inject, 
  ValidationPipe, 
  UsePipes,
  BadRequestException,
  Logger
} from "@nestjs/common";
import { IsString, IsEmail, IsNumber, IsEnum, IsOptional, validate } from "class-validator";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Employee, PayrollRecord, LeaveRequest, Role, Department } from "./src/types";
import { DEPARTMENTS } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DTOs (Data Transfer Objects) ---

class EmployeeGovIdsDto {
  @IsOptional() @IsString() sss?: string;
  @IsOptional() @IsString() philhealth?: string;
  @IsOptional() @IsString() pagibig?: string;
  @IsOptional() @IsString() tin?: string;
}

class CreateEmployeeDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsString() department!: Department;
  @IsString() position!: string;
  @IsNumber() salary!: number;
  @IsString() hireDate!: string;
  @IsEnum(['admin', 'dept_head', 'employee', 'payroll_officer']) role!: Role;
  @IsEnum(['Regular', 'Casual', 'Contractual']) employmentStatus!: string;
  @IsOptional() govIds?: EmployeeGovIdsDto;
}

class CreateAttendanceDto {
  @IsString() employeeId!: string;
  @IsString() date!: string;
  @IsString() timeIn!: string;
}

class UpdateAttendanceDto {
  @IsOptional() @IsString() timeOut?: string;
  @IsOptional() @IsNumber() totalHours?: number;
  @IsOptional() @IsEnum(['present', 'late', 'absent', 'undertime']) status?: string;
}

class CreatePayrollDto {
  @IsString() employeeId!: string;
  @IsString() period!: string;
  @IsNumber() basicSalary!: number;
  @IsOptional() allowances?: any;
  @IsOptional() deductions?: any;
  @IsNumber() overtimePay!: number;
  @IsNumber() grossPay!: number;
  @IsNumber() netPay!: number;
  @IsEnum(['pending', 'approved', 'paid']) status!: string;
}

class CreateLeaveDto {
  @IsString() employeeId!: string;
  @IsEnum(['Vacation', 'Sick', 'Maternity', 'Paternity', 'Emergency']) type!: string;
  @IsString() startDate!: string;
  @IsString() endDate!: string;
  @IsString() reason!: string;
}

class UpdateLeaveDto {
  @IsEnum(['approved', 'rejected']) status!: 'approved' | 'rejected';
  @IsOptional() @IsString() remarks?: string;
}

class CreateAuditDto {
  @IsString() userId!: string;
  @IsString() userName!: string;
  @IsString() action!: string;
  @IsString() target!: string;
}

class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsNumber() salary?: number;
  @IsOptional() @IsString() hireDate?: string;
  @IsOptional() @IsEnum(['admin', 'employee']) role?: Role;
  @IsOptional() @IsEnum(['active', 'inactive']) status?: 'active' | 'inactive';
}

// --- Supabase Service ---

@Injectable()
class SupabaseService {
  private client: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (url && key) {
      this.client = createClient(url, key);
      this.logger.log("Enterprise Supabase Engine Online");
    } else {
      this.logger.warn("Supabase credentials undefined. Engaging mock infrastructure.");
    }
  }

  getClient() { return this.client; }
}

// --- Standard Response Wrapper ---
const wrap = (data: any, message = "Success") => ({
  success: true,
  timestamp: new Date().toISOString(),
  message,
  data,
});

// --- Controllers ---

@Controller("api/employees")
@UsePipes(new ValidationPipe({ transform: true }))
class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  private mockEmployees: Employee[] = [
    { 
      id: "1", firstName: "Enz", lastName: "Labrada", email: "labradarenz@gmail.com", 
      department: "Administrative" as any, position: "Chief Technology Officer", salary: 150000, 
      hireDate: "2020-01-01", role: 'admin', status: 'active', employmentStatus: 'Regular',
      govIds: { sss: "00-0000000-0", philhealth: "00-000000000-0", pagibig: "0000-0000-0000", tin: "000-000-000-000" },
      leaveBalances: { vacation: 15, sick: 15, emergency: 5 }
    },
    { 
      id: "2", firstName: "Juan", lastName: "Dela Cruz", email: "juan.dc@talibon.gov.ph", 
      department: "Administrative" as any, position: "Senior Analyst", salary: 45000, 
      hireDate: "2020-01-15", role: 'admin', status: 'active', employmentStatus: 'Regular',
      govIds: { sss: "", philhealth: "", pagibig: "", tin: "" }, leaveBalances: { vacation: 15, sick: 15, emergency: 5 }
    },
  ];

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client
        .from("employees")
        .select("*")
        .order('created_at', { ascending: false });
      
      if (!error) {
        return wrap(data.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          department: row.department,
          position: row.position,
          salary: row.salary,
          hireDate: row.hire_date,
          role: row.role,
          status: row.status,
          employmentStatus: row.employment_status,
          sss: row.sss,
          philhealth: row.philhealth,
          pagibig: row.pagibig,
          tin: row.tin,
        })));
      }
      this.logger.error(`Supabase Fetch Error: ${error.message}`);
    }
    return wrap(this.mockEmployees);
  }

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    const client = this.supabase.getClient();
    if (client) {
      const payload = {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        department: dto.department,
        position: dto.position,
        salary: dto.salary,
        hire_date: dto.hireDate,
        role: dto.role,
        employment_status: dto.employmentStatus,
        status: 'active',
        sss: dto.govIds?.sss,
        philhealth: dto.govIds?.philhealth,
        pagibig: dto.govIds?.pagibig,
        tin: dto.govIds?.tin,
      };
      const { data, error } = await client.from("employees").insert([payload]).select();
      if (!error) return wrap(data[0], "Employee profile created");
      throw new BadRequestException(error.message);
    }
    const newEmp = { ...dto, id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, status: 'active' as const } as any;
    this.mockEmployees.unshift(newEmp);
    return wrap(newEmp, "Mock employee created (Enterprise Mode)");
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    const client = this.supabase.getClient();
    if (client) {
      const payload: any = {};
      if (dto.firstName) payload.first_name = dto.firstName;
      if (dto.lastName) payload.last_name = dto.lastName;
      if (dto.email) payload.email = dto.email;
      if (dto.department) payload.department = dto.department;
      if (dto.position) payload.position = dto.position;
      if (dto.salary) payload.salary = dto.salary;
      if (dto.hireDate) payload.hire_date = dto.hireDate;
      if (dto.role) payload.role = dto.role;
      if (dto.status) payload.status = dto.status;

      const { data, error } = await client.from("employees").update(payload).eq("id", id).select();
      if (!error) return wrap(data[0], "Employee profile updated");
      throw new BadRequestException(error.message);
    }
    const index = this.mockEmployees.findIndex(e => e.id === id);
    if (index === -1) throw new BadRequestException("Employee not found");
    this.mockEmployees[index] = { ...this.mockEmployees[index], ...(dto as any) };
    return wrap(this.mockEmployees[index], "Mock record updated");
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const client = this.supabase.getClient();
    if (client) {
      const { error } = await client.from("employees").delete().eq("id", id);
      if (error) throw new BadRequestException(error.message);
      return wrap(null, "Employee record decommissioned");
    }
    this.mockEmployees = this.mockEmployees.filter(e => e.id !== id);
    return wrap(null, "Mock record deleted");
  }
}

@Controller("api/payroll")
@UsePipes(new ValidationPipe({ transform: true }))
class PayrollController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("payroll_records").select("*, employees(first_name, last_name)");
      if (!error) return wrap(data.map(row => ({
         id: row.id,
         employeeId: row.employee_id,
         period: row.period,
         basicSalary: row.basic_salary,
         hazardAllowance: row.hazard_allowance,
         bonusAllowance: row.bonus_allowance,
         otherAllowance: row.other_allowance,
         sssDeduction: row.sss_deduction,
         philhealthDeduction: row.philhealth_deduction,
         pagibigDeduction: row.pagibig_deduction,
         taxDeduction: row.tax_deduction,
         latePenalty: row.late_penalty,
         overtimePay: row.overtime_pay,
         grossPay: row.gross_pay,
         netPay: row.net_pay,
         status: row.status,
         processedAt: row.processed_at,
         employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown'
      })));
    }
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreatePayrollDto) {
    const client = this.supabase.getClient();
    if (client) {
      const payload = {
         employee_id: dto.employeeId,
         period: dto.period,
         basic_salary: dto.basicSalary,
         hazard_allowance: dto.allowances?.hazard,
         bonus_allowance: dto.allowances?.bonus,
         other_allowance: dto.allowances?.other,
         sss_deduction: dto.deductions?.sss,
         philhealth_deduction: dto.deductions?.philhealth,
         pagibig_deduction: dto.deductions?.pagibig,
         tax_deduction: dto.deductions?.tax,
         late_penalty: dto.deductions?.latePenalty,
         overtime_pay: dto.overtimePay,
         gross_pay: dto.grossPay,
         net_pay: dto.netPay,
         status: dto.status
      };
      const { data, error } = await client.from("payroll_records").insert([payload]).select();
      if (!error) return wrap(data[0]);
      throw new BadRequestException(error.message);
    }
    return wrap({ ...dto, id: `PAY-${Date.now()}` });
  }
}

@Controller("api/leave")
@UsePipes(new ValidationPipe({ transform: true }))
class LeaveController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").select("*").order('requested_at', { ascending: false });
      if (!error) return wrap(data.map(row => ({
         id: row.id,
         employeeId: row.employee_id,
         type: row.type,
         startDate: row.start_date,
         endDate: row.end_date,
         reason: row.reason,
         status: row.status,
         requestedAt: row.requested_at,
         remarks: row.remarks
      })));
    }
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreateLeaveDto) {
    const client = this.supabase.getClient();
    if (client) {
      const payload = {
         employee_id: dto.employeeId,
         type: dto.type,
         start_date: dto.startDate,
         end_date: dto.endDate,
         reason: dto.reason,
         status: 'pending'
      };
      const { data, error } = await client.from("leave_requests").insert([payload]).select();
      if (!error) return wrap(data[0]);
    }
    return wrap({ ...dto, id: `LV-${Date.now()}`, status: 'pending', requestedAt: new Date().toISOString() });
  }

  @Put(":id/status")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateLeaveDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").update({ status: dto.status, remarks: dto.remarks }).eq("id", id).select();
      if (!error) return wrap(data[0]);
    }
    return wrap({ id, ...dto }, "Leave request status updated");
  }
}

@Controller("api/attendance")
@UsePipes(new ValidationPipe({ transform: true }))
class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client
        .from("attendance_records")
        .select("*, employees(first_name, last_name)")
        .order('date', { ascending: false })
        .order('time_in', { ascending: false });
      if (!error) return wrap(data.map(row => ({
         id: row.id,
         employeeId: row.employee_id,
         date: row.date,
         timeIn: row.time_in,
         timeOut: row.time_out,
         totalHours: row.total_hours,
         status: row.status,
         employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown'
      })));
      this.logger.error(`Supabase Attendance Fetch Error: ${error.message}`);
    }
    return wrap([]);
  }

  @Post("log")
  async log(@Body() dto: CreateAttendanceDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data: existing, error: fetchError } = await client
        .from("attendance_records")
        .select("*")
        .eq("employee_id", dto.employeeId)
        .eq("date", dto.date)
        .is("time_out", null)
        .single();

      if (!fetchError && existing) {
        const timeOut = new Date().toISOString();
        const timeInDate = new Date(existing.time_in);
        const timeOutDate = new Date(timeOut);
        const hours = Math.round((timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60) * 100) / 100;

        const { data, error } = await client
          .from("attendance_records")
          .update({ time_out: timeOut, total_hours: hours })
          .eq("id", existing.id)
          .select();
        
        if (!error) return wrap(data[0], "Attendance record updated (Clock Out)");
      }

      const { data, error } = await client
        .from("attendance_records")
        .insert([{ 
          employee_id: dto.employeeId,
          date: dto.date,
          time_in: dto.timeIn,
          status: 'present'
        }])
        .select();
      
      if (!error) return wrap(data[0], "Attendance record updated (Clock In)");
      throw new BadRequestException(error.message);
    }
    return wrap({ ...dto, id: `ATT-${Date.now()}`, status: 'present', totalHours: 0 });
  }
}

@Controller("api/audit")
class AuditController {
  private readonly logger = new Logger(AuditController.name);
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client
        .from("audit_logs")
        .select("*")
        .order('timestamp', { ascending: false });
      if (!error) return wrap(data);
      this.logger.error(`Supabase Audit Fetch Error: ${error.message}`);
    }
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreateAuditDto) {
    const client = this.supabase.getClient();
    
    if (client) {
      const payload = {
         user_id: dto.userId,
         user_name: dto.userName,
         action: dto.action,
         target: dto.target
      };
      const { data, error } = await client.from("audit_logs").insert([payload]).select();
      if (!error) return wrap(data[0]);
    }
    return wrap({ ...dto, timestamp: new Date().toISOString(), id: `LOG-${Date.now()}` });
  }
}

@Controller("api/notifications")
class NotificationController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get(":userId")
  async findByUser(@Param("userId") userId: string) {
    return wrap([]);
  }
}

@Module({
  controllers: [
    EmployeeController, 
    PayrollController, 
    LeaveController, 
    AttendanceController, 
    AuditController,
    NotificationController
  ],
  providers: [SupabaseService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) return next();
      vite.middlewares(req, res, next);
    });
  } else {
    const expressApp = app.getHttpAdapter().getInstance();
    const distPath = path.join(process.cwd(), "dist");
    expressApp.use(express.static(distPath));
    expressApp.get("*", (req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await app.listen(PORT, "0.0.0.0", () => {
    Logger.log(`Enterprise HRIS Core online at port ${PORT}`, 'Bootstrap');
  });
}

bootstrap();
