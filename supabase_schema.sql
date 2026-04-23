-- 🏛️ MUNICIPALITY OF TALIBON HRIS: DATABASE SCHEMA --
-- Version: 2.0 (Identity-Based Access)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. EMPLOYEES TABLE (Personnel Registry)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    employee_id TEXT UNIQUE, -- Manual ID (e.g., TAL-2026-001)
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    salary DECIMAL(12, 2) DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE,
    role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'dept_head', 'employee', 'payroll_officer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    employment_status TEXT DEFAULT 'Regular',
    sss TEXT,
    philhealth TEXT,
    pagibig TEXT,
    tin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDANCE TABLE (Time Ledger)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_in TIMESTAMPTZ NOT NULL,
    time_out TIMESTAMPTZ,
    total_hours DECIMAL(5, 2) DEFAULT 0,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'undertime')),
    is_correction_requested BOOLEAN DEFAULT false,
    correction_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYROLL TABLE (Financial Matrix)
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- YYYY-MM
    basic_salary DECIMAL(12, 2) NOT NULL,
    hazard_allowance DECIMAL(12, 2) DEFAULT 0,
    bonus_allowance DECIMAL(12, 2) DEFAULT 0,
    other_allowance DECIMAL(12, 2) DEFAULT 0,
    sss_deduction DECIMAL(12, 2) DEFAULT 0,
    philhealth_deduction DECIMAL(12, 2) DEFAULT 0,
    pagibig_deduction DECIMAL(12, 2) DEFAULT 0,
    tax_deduction DECIMAL(12, 2) DEFAULT 0,
    late_penalty DECIMAL(12, 2) DEFAULT 0,
    overtime_pay DECIMAL(12, 2) DEFAULT 0,
    gross_pay DECIMAL(12, 2) NOT NULL,
    net_pay DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEAVE REQUESTS TABLE (Workforce Mobility)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Vacation', 'Sick', 'Maternity', 'Paternity', 'Emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE (Security Terminal)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL, -- e.g., 'LOGIN_SUCCESS', 'TIME_IN'
    target TEXT, -- e.g., 'Attendance Terminal'
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- 8. SECURITY (Simplified for Initial Setup)
-- IMPORTANT: In a production environment, enable RLS and create policies.
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for internal ID verification" ON employees FOR SELECT USING (true);
