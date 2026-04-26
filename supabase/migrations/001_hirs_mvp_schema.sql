create table if not exists employees (
  id text primary key,
  firstName text not null,
  lastName text not null,
  email text not null unique,
  department text not null,
  position text not null,
  salary numeric not null,
  hireDate date not null,
  role text not null,
  status text not null default 'active',
  employmentStatus text not null,
  govIds jsonb not null default '{}'::jsonb,
  leaveBalances jsonb not null default '{"vacation":15,"sick":15,"emergency":5}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists attendance_records (
  id text primary key,
  employeeId text not null,
  date date not null,
  timeIn timestamptz not null,
  timeOut timestamptz null,
  totalHours numeric not null default 0,
  status text not null default 'present'
);

create table if not exists leave_requests (
  id text primary key,
  employeeId text not null,
  type text not null,
  startDate date not null,
  endDate date not null,
  reason text not null,
  status text not null default 'pending',
  requestedAt timestamptz not null default now(),
  remarks text null
);

create table if not exists payroll (
  id text primary key,
  employeeId text not null,
  period text not null,
  basicSalary numeric not null,
  allowances jsonb not null default '{}'::jsonb,
  deductions jsonb not null default '{}'::jsonb,
  overtimePay numeric not null default 0,
  grossPay numeric not null,
  netPay numeric not null,
  status text not null,
  processedAt timestamptz null
);

create table if not exists audit_logs (
  id text primary key,
  userId text not null,
  userName text not null,
  action text not null,
  target text not null,
  timestamp timestamptz not null default now()
);
