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
      govIds: {}, leaveBalances: { vacation: 15, sick: 15, emergency: 5 }
    },
  ];

  @Get()
  async findAll() {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("employees").select("*").order('created_at', { ascending: false });
      if (!error) return wrap(data);
      this.logger.error(`Supabase Fetch Error: ${error.message}`);
    }
    return wrap(this.mockEmployees);
  }

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("employees").insert([dto]).select();
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
      const { data, error } = await client.from("employees").update(dto).eq("id", id).select();
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
      const { data, error } = await client.from("payroll").select("*, employees(firstName, lastName)");
      if (!error) return wrap(data);
    }
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreatePayrollDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("payroll").insert([dto]).select();
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
      const { data, error } = await client.from("leave_requests").select("*").order('requestedAt', { ascending: false });
      if (!error) return wrap(data);
    }
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreateLeaveDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").insert([{ ...dto, status: 'pending', requestedAt: new Date().toISOString() }]).select();
      if (!error) return wrap(data[0]);
    }
    return wrap({ ...dto, id: `LV-${Date.now()}`, status: 'pending', requestedAt: new Date().toISOString() });
  }

  @Put(":id/status")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateLeaveDto) {
    const client = this.supabase.getClient();
    if (client) {
      const { data, error } = await client.from("leave_requests").update(dto).eq("id", id).select();
      if (!error) return wrap(data[0]);
    }
    return wrap({ id, ...dto }, "Leave request status updated");
  }
}

@Controller("api/attendance")
@UsePipes(new ValidationPipe({ transform: true }))
class AttendanceController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    return wrap([]);
  }

  @Post("log")
  async log(@Body() dto: CreateAttendanceDto) {
    return wrap({ ...dto, id: `ATT-${Date.now()}`, status: 'present', totalHours: 0 });
  }
}

@Controller("api/audit")
class AuditController {
  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  @Get()
  async findAll() {
    return wrap([]);
  }

  @Post()
  async create(@Body() dto: CreateAuditDto) {
    return wrap({ ...dto, id: `LOG-${Date.now()}`, timestamp: new Date().toISOString() });
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
