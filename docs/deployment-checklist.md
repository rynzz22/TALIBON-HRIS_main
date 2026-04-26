# HRIS MVP Deployment Checklist

## Environment
- Set `VITE_SUPABASE_URL`
- Set `SUPABASE_SERVICE_ROLE_KEY`
- Set `JWT_SECRET`
- Set seeded auth credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) if defaults are not desired

## Database
- Apply SQL migrations under `supabase/migrations`
- Verify required tables are present
- Seed initial admin employee record

## Build and Release
- Run `npm ci`
- Run `npm run lint`
- Run `npm run build`
- Deploy service with `NODE_ENV=production`

## Post-Deploy Validation
- Validate login and token-protected APIs
- Validate dashboard summary endpoint
- Validate payroll and leave approval workflows
- Confirm audit logs are being written

## Rollback
- Revert to previous deployment artifact
- Restore previous DB snapshot if migration causes regression
