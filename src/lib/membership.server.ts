import { getSql } from "@/lib/db";
import { uid } from "@/lib/utils";

export type PlanRow = {
  id: string;
  name: string;
  price_try: number;
  duration_days: number;
  terms: string;
  active: boolean;
};

export type MembershipRow = {
  user_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  role: string;
};

export async function listPlans(): Promise<PlanRow[]> {
  const sql = await getSql();
  return sql<PlanRow>`
    select id, name, price_try, duration_days, terms, active
    from plans
    where active = true
    order by price_try asc
  `;
}

export async function getMembership(userId: string): Promise<MembershipRow | null> {
  const sql = await getSql();
  const rows = await sql<MembershipRow>`
    select user_id, plan_id, status, starts_at::text, ends_at::text, role
    from memberships
    where user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

/** True when membership exists, is active, and ends_at is in the future. */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const m = await getMembership(userId);
  if (!m) return false;
  if (m.status !== "active" && m.status !== "trialing") return false;
  return new Date(m.ends_at).getTime() > Date.now();
}

export async function ensureMembership(
  userId: string,
  planId: string,
): Promise<{ ok: true; membership: MembershipRow } | { ok: false; error: string }> {
  const sql = await getSql();
  const plans = await sql<PlanRow>`
    select id, name, price_try, duration_days, terms, active
    from plans where id = ${planId} and active = true limit 1
  `;
  const plan = plans[0];
  if (!plan) return { ok: false, error: "Plan bulunamadı." };

  const ends = new Date(Date.now() + plan.duration_days * 86_400_000).toISOString();
  const existing = await getMembership(userId);

  if (existing) {
    await sql`
      update memberships
      set plan_id = ${planId},
          status = 'active',
          starts_at = now(),
          ends_at = ${ends}::timestamptz,
          updated_at = now()
      where user_id = ${userId}
    `;
  } else {
    await sql`
      insert into memberships (user_id, plan_id, status, starts_at, ends_at, role)
      values (${userId}, ${planId}, 'active', now(), ${ends}::timestamptz, 'member')
    `;
  }

  const membership = await getMembership(userId);
  if (!membership) return { ok: false, error: "Üyelik kaydı oluşturulamadı." };
  return { ok: true, membership };
}

/**
 * Record a usage event. When idempotencyKey is provided and already exists
 * for this user, returns the existing event id (no duplicate insert).
 * Does NOT enforce quotas — metering only.
 */
export async function recordUsage(opts: {
  userId: string;
  operation: string;
  units?: number;
  provider?: string;
  jobId?: string;
  planId?: string;
  meta?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<string> {
  const sql = await getSql();
  const key = opts.idempotencyKey?.trim() || null;

  if (key) {
    const existing = await sql<{ id: string }>`
      select id from usage_events
      where user_id = ${opts.userId} and idempotency_key = ${key}
      limit 1
    `;
    if (existing[0]) return existing[0].id;
  }

  const id = uid();
  try {
    await sql`
      insert into usage_events (id, user_id, plan_id, operation, units, provider, job_id, meta, idempotency_key)
      values (
        ${id},
        ${opts.userId},
        ${opts.planId ?? null},
        ${opts.operation},
        ${opts.units ?? 1},
        ${opts.provider ?? null},
        ${opts.jobId ?? null},
        ${JSON.stringify(opts.meta ?? {})}::jsonb,
        ${key}
      )
    `;
    return id;
  } catch {
    // Unique race: fetch existing
    if (key) {
      const again = await sql<{ id: string }>`
        select id from usage_events
        where user_id = ${opts.userId} and idempotency_key = ${key}
        limit 1
      `;
      if (again[0]) return again[0].id;
    }
    throw new Error("usage_events insert failed");
  }
}

/**
 * Create an AI job. With idempotencyKey, reuses an existing job for the same
 * user+key instead of inserting a duplicate.
 */
export async function createAiJob(opts: {
  userId: string;
  projectId?: string | null;
  type: string;
  provider?: string;
  input?: Record<string, unknown>;
  externalId?: string | null;
  idempotencyKey?: string | null;
  status?: string;
}): Promise<{ jobId: string; reused: boolean }> {
  const sql = await getSql();
  const key = opts.idempotencyKey?.trim() || null;

  if (key) {
    const existing = await sql<{ id: string }>`
      select id from ai_jobs
      where user_id = ${opts.userId} and idempotency_key = ${key}
      limit 1
    `;
    if (existing[0]) return { jobId: existing[0].id, reused: true };
  }

  const id = uid();
  const status = opts.status ?? "pending";
  try {
    await sql`
      insert into ai_jobs (id, user_id, project_id, type, provider, status, input, external_id, idempotency_key)
      values (
        ${id},
        ${opts.userId},
        ${opts.projectId ?? null},
        ${opts.type},
        ${opts.provider ?? "xai"},
        ${status},
        ${JSON.stringify(opts.input ?? {})}::jsonb,
        ${opts.externalId ?? null},
        ${key}
      )
    `;
    return { jobId: id, reused: false };
  } catch {
    if (key) {
      const again = await sql<{ id: string }>`
        select id from ai_jobs
        where user_id = ${opts.userId} and idempotency_key = ${key}
        limit 1
      `;
      if (again[0]) return { jobId: again[0].id, reused: true };
    }
    throw new Error("ai_jobs insert failed");
  }
}

export async function completeAiJob(
  jobId: string,
  userId: string,
  result: { status: "done" | "failed"; output?: Record<string, unknown>; error?: string },
) {
  const sql = await getSql();
  await sql`
    update ai_jobs
    set status = ${result.status},
        output = ${JSON.stringify(result.output ?? {})}::jsonb,
        error = ${result.error ?? null},
        completed_at = now()
    where id = ${jobId} and user_id = ${userId}
  `;
}

export async function markAiJobRunning(jobId: string, userId: string) {
  const sql = await getSql();
  await sql`
    update ai_jobs
    set status = 'running'
    where id = ${jobId} and user_id = ${userId} and status = 'pending'
  `;
}
