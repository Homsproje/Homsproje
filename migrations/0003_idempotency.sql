-- Stage 2.2: idempotency keys for AI jobs and usage events.
-- Prevents duplicate metering on client/network retries.
-- Does not implement billing or quotas.

alter table ai_jobs
  add column if not exists idempotency_key text;

alter table usage_events
  add column if not exists idempotency_key text;

-- One active job per user+key (retries reuse the same logical request).
create unique index if not exists ai_jobs_user_idempotency_uidx
  on ai_jobs (user_id, idempotency_key)
  where idempotency_key is not null;

-- One usage event per user+key.
create unique index if not exists usage_events_user_idempotency_uidx
  on usage_events (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists ai_jobs_status_idx on ai_jobs (status);
