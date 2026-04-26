# HRIS MVP UAT Checklist

## Core Flows
- Login with each role account (`admin`, `dept_head`, `employee`, `payroll_officer`)
- Create, update, and delete employee records as allowed by role
- Log attendance time-in and time-out; verify computed `totalHours`
- Submit leave request as employee; approve/reject as admin/dept head
- Generate payroll entries as payroll officer/admin
- Load dashboard summary and verify KPI counts match source data

## Access Control
- Ensure employee cannot access payroll, employee registry, or audit endpoints
- Ensure payroll officer cannot delete employees
- Ensure dept head cannot access audit log endpoint
- Ensure unauthenticated requests to `/api/*` return unauthorized

## Data Integrity
- Verify records persist in `employees`, `attendance_records`, `leave_requests`, `payroll`, `audit_logs`
- Validate required DTO fields reject malformed payloads
- Verify leave status transitions only from admin/dept head actions

## Release Readiness
- Run `npm run lint`
- Run `npm run build`
- Run manual smoke test in browser for each module tab
