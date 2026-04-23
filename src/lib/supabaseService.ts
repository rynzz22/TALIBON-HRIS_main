import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Employee, AttendanceRecord, PayrollRecord, LeaveRequest, AuditLog, AppNotification } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Enterprise Supabase Service
 * Handles data mapping between snake_case DB and camelCase App logic
 */
export const SupabaseService = {
  employees: {
    async list() {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(this.mapFromDB) };
    },
    
    async create(employee: Partial<Employee>) {
      const payload = this.mapToDB(employee);
      const { data, error } = await supabase
        .from('employees')
        .insert([payload])
        .select();
      
      if (error) throw error;
      return { data: this.mapFromDB(data[0]) };
    },

    async update(id: string, updates: Partial<Employee>) {
      const payload = this.mapToDB(updates);
      const { data, error } = await supabase
        .from('employees')
        .update(payload)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return { data: this.mapFromDB(data[0]) };
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },

    async getById(id: string) {
      try {
        // Build the OR filter dynamically to avoid UUID format errors
        let orFilter = `employee_id.eq.${id},email.eq.${id}`;
        
        // Simple UUID regex check
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUUID) {
          orFilter += `,id.eq.${id}`;
        }

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .or(orFilter)
          .maybeSingle(); // Use maybeSingle to avoid errors when no record is found
        
        if (error) throw error;
        return { data: data ? this.mapFromDB(data) : null };
      } catch (error) {
        console.error("Error in getById:", error);
        throw error;
      }
    },

    mapToDB(emp: Partial<Employee>) {
      const mapped: any = {};
      if (emp.employeeId) mapped.employee_id = emp.employeeId;
      if (emp.firstName) mapped.first_name = emp.firstName;
      if (emp.lastName) mapped.last_name = emp.lastName;
      if (emp.email) mapped.email = emp.email;
      if (emp.department) mapped.department = emp.department;
      if (emp.position) mapped.position = emp.position;
      if (emp.salary !== undefined) mapped.salary = emp.salary;
      if (emp.hireDate) mapped.hire_date = emp.hireDate;
      if (emp.role) mapped.role = emp.role;
      if (emp.status) mapped.status = emp.status;
      if (emp.employmentStatus) mapped.employment_status = emp.employmentStatus;
      if (emp.sss) mapped.sss = emp.sss;
      if (emp.philhealth) mapped.philhealth = emp.philhealth;
      if (emp.pagibig) mapped.pagibig = emp.pagibig;
      if (emp.tin) mapped.tin = emp.tin;
      return mapped;
    },

    mapFromDB(row: any): Employee {
      return {
        id: row.id,
        employeeId: row.employee_id,
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
      };
    }
  },

  attendance: {
    async list() {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, employees(first_name, last_name)')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(this.mapFromDB) };
    },

    async log(employeeId: string, type: 'in' | 'out') {
       const today = new Date().toISOString().split('T')[0];
       const time = new Date().toISOString();

       if (type === 'out') {
          const { data: active } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .is('time_out', null)
            .order('time_in', { ascending: false })
            .limit(1)
            .maybeSingle(); // Better than single() to avoid error
          
          if (active) {
             const timeInDate = new Date(active.time_in);
             const timeOutDate = new Date(time);
             const hours = Math.round((timeOutDate.getTime() - timeInDate.getTime()) / (1000 * 60 * 60) * 100) / 100;
             
             const { data, error } = await supabase
               .from('attendance_records')
               .update({ time_out: time, total_hours: hours })
               .eq('id', active.id)
               .select();
             if (error) throw error;
             return { data: this.mapFromDB(data[0]) };
          }
       }

       // Log 'in' with automatic status calculation
       const arrivalTime = new Date();
       const startOfDuty = new Date();
       startOfDuty.setHours(8, 0, 0, 0); // 8:00 AM

       let status: 'present' | 'late' = 'present';
       if (arrivalTime > startOfDuty) {
          status = 'late';
       }

       const { data, error } = await supabase
         .from('attendance_records')
         .insert([{
            employee_id: employeeId,
            date: today,
            time_in: time,
            status: status
         }])
         .select();
       
       if (error) throw error;
       return { data: this.mapFromDB(data[0]) };
    },

    mapFromDB(row: any): AttendanceRecord {
      return {
        id: row.id,
        employeeId: row.employee_id,
        date: row.date,
        timeIn: row.time_in,
        timeOut: row.time_out,
        totalHours: row.total_hours,
        status: row.status,
        isCorrectionRequested: row.is_correction_requested,
        correctionNote: row.correction_note,
      };
    }
  },

  payroll: {
    async list() {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, employees(first_name, last_name)')
        .order('period', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(this.mapFromDB) };
    },

    mapFromDB(row: any): PayrollRecord {
      return {
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
      };
    }
  },

  leaves: {
    async list() {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(this.mapFromDB) };
    },

    async create(request: Partial<LeaveRequest>) {
       const payload = {
          employee_id: request.employeeId,
          type: request.type,
          start_date: request.startDate,
          end_date: request.endDate,
          reason: request.reason,
          status: 'pending'
       };
       const { data, error } = await supabase
         .from('leave_requests')
         .insert([payload])
         .select();
       
       if (error) throw error;
       return { data: this.mapFromDB(data[0]) };
    },

    async updateStatus(id: string, status: string, remarks?: string) {
       const { data, error } = await supabase
         .from('leave_requests')
         .update({ status, remarks })
         .eq('id', id)
         .select();
       
       if (error) throw error;
       return { data: this.mapFromDB(data[0]) };
    },

    mapFromDB(row: any): LeaveRequest {
      return {
        id: row.id,
        employeeId: row.employee_id,
        type: row.type,
        startDate: row.start_date,
        endDate: row.end_date,
        reason: row.reason,
        status: row.status,
        requestedAt: row.requested_at,
        remarks: row.remarks,
      };
    }
  },

  audit: {
    async list() {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return { data: data.map(this.mapFromDB) };
    },

    async log(log: Partial<AuditLog>) {
       try {
         const payload = {
            user_id: log.userId,
            user_name: log.userName,
            action: log.action,
            target: log.target
         };
         const { error } = await supabase.from('audit_logs').insert([payload]);
         if (error) {
            console.warn("Audit logging failed but proceeding:", error);
         }
       } catch (e) {
         console.warn("Silent audit failure:", e);
       }
    },

    mapFromDB(row: any): AuditLog {
      return {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        action: row.action,
        target: row.target,
        timestamp: row.timestamp,
      };
    }
  }
};
