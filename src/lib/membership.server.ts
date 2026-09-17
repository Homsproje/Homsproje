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

export async function recordUsage(opts: {
  userId: string;
  operation: string;
  units?: number;
  provider?: string;
  jobId?: string;
  planId?: string;
  meta?: Record<string, unknown>;
}) {
  const sql = await getSql();
  const id = uid();
  await sql`
    insert into usage_events (id, user_id, plan_id, operation, units, provider, job_id, meta)
    values (
      ${id},
      ${opts.userId},
      ${opts.planId ?? null},
      ${opts.operation},
      ${opts.units ?? 1},
      ${opts.provider ?? null},
      ${opts.jobId ?? null},
      ${JSON.stringify(opts.meta ?? {})}::jsonb
    )
  `;
  return id;
}

export async function createAiJob(opts: {
  userId: string;
  projectId?: string | null;
  type: string;
  provider?: string;
  input?: Record<string, unknown>;
  externalId?: string | null;
}) {
  const sql = await getSql();
  const id = uid();
  await sql`
    insert into ai_jobs (id, user_id, project_id, type, provider, status, input, external_id)
    values (
      ${id},
      ${opts.userId},
      ${opts.projectId ?? null},
      ${opts.type},
      ${opts.provider ?? "xai"},
      'pending',
      ${JSON.stringify(opts.input ?? {})}::jsonb,
      ${opts.externalId ?? null}
    )
  `;
  return id;
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
