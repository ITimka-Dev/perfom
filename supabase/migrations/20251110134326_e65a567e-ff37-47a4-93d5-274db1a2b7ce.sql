-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule weekly report generation every Sunday at 23:00
SELECT cron.schedule(
  'generate-weekly-reports',
  '0 23 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://uepcuigiegeqefgrpifu.supabase.co/functions/v1/generate-weekly-reports',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcGN1aWdpZWdlcWVmZ3JwaWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTUyNDQsImV4cCI6MjA3NTc5MTI0NH0.dhbvQWeBctzpaGqwnGuMGy0hP3-bfuHBhZxVxA6-Fv8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);