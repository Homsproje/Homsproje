import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  ensureMembership,
  getMembership,
  hasActiveMembership,
  listPlans,
} from "@/lib/membership.server";

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
  const plans = await listPlans();
  return {
    ok: true as const,
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price_try,
      days: p.duration_days,
      terms: p.terms,
    })),
  };
});

export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const membership = await getMembership(context.userId);
    const active = await hasActiveMembership(context.userId);
    return { ok: true as const, membership, active };
  });

export const activateMyPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ planId: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    // Stage-2: no Stripe yet — activating a plan is free/trial style.
    // Paid enforcement lands with billing.
    const res = await ensureMembership(context.userId, data.planId);
    if (!res.ok) return { ok: false as const, error: res.error };
    return { ok: true as const, membership: res.membership };
  });
