<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TALIBON HRIS MVP

Municipal HRIS MVP built with React, NestJS, and Supabase.

## Run Locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set required values
3. Start app and API: `npm run dev`

## Seeded Login Accounts

- `admin@talibon.gov.ph / admin123`
- `dept.head@talibon.gov.ph / depthead123`
- `payroll@talibon.gov.ph / payroll123`
- `employee@talibon.gov.ph / employee123`

## Database Setup

- Apply SQL under `supabase/migrations/001_hirs_mvp_schema.sql`
- Ensure tables are available before enabling production mode

## QA and Deployment

- UAT checklist: `docs/uat-checklist.md`
- Deployment checklist: `docs/deployment-checklist.md`
