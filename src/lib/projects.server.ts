import { getSql } from "@/lib/db";
import { uid } from "@/lib/utils";

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  style: string;
  view: string;
  brief: string;
  created_at: string;
  updated_at: string;
};

export type AssetRow = {
  id: string;
  project_id: string;
  user_id: string;
  kind: string;
  role: string | null;
  url: string;
  storage_key: string | null;
  prompt: string;
  view: string | null;
  title: string | null;
  created_at: string;
};

export type TurnRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  text: string;
  kind: string | null;
  url: string | null;
  created_at: string;
};

async function assertProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select id from projects where id = ${projectId} and user_id = ${userId} limit 1
  `;
  return rows.length > 0;
}

export async function listProjects(userId: string): Promise<ProjectRow[]> {
  const sql = await getSql();
  return sql<ProjectRow>`
    select id, user_id, title, mode, style, view, brief,
           created_at::text, updated_at::text
    from projects
    where user_id = ${userId}
    order by updated_at desc
  `;
}

export async function getProject(projectId: string, userId: string): Promise<ProjectRow | null> {
  const sql = await getSql();
  const rows = await sql<ProjectRow>`
    select id, user_id, title, mode, style, view, brief,
           created_at::text, updated_at::text
    from projects
    where id = ${projectId} and user_id = ${userId}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function createProject(
  userId: string,
  data: { title: string; mode: string; style: string; view: string; brief?: string },
): Promise<ProjectRow> {
  const sql = await getSql();
  const id = uid();
  await sql`
    insert into projects (id, user_id, title, mode, style, view, brief)
    values (
      ${id},
      ${userId},
      ${data.title},
      ${data.mode},
      ${data.style},
      ${data.view},
      ${data.brief ?? ""}
    )
  `;
  const row = await getProject(id, userId);
  if (!row) throw new Error("Proje oluşturulamadı.");
  return row;
}

export async function updateProject(
  projectId: string,
  userId: string,
  patch: Partial<{ title: string; mode: string; style: string; view: string; brief: string }>,
): Promise<ProjectRow | null> {
  if (!(await assertProjectOwner(projectId, userId))) return null;
  const sql = await getSql();
  const current = await getProject(projectId, userId);
  if (!current) return null;
  const title = patch.title ?? current.title;
  const mode = patch.mode ?? current.mode;
  const style = patch.style ?? current.style;
  const view = patch.view ?? current.view;
  const brief = patch.brief ?? current.brief;
  await sql`
    update projects
    set title = ${title},
        mode = ${mode},
        style = ${style},
        view = ${view},
        brief = ${brief},
        updated_at = now()
    where id = ${projectId} and user_id = ${userId}
  `;
  return getProject(projectId, userId);
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  if (!(await assertProjectOwner(projectId, userId))) return false;
  const sql = await getSql();
  await sql`delete from projects where id = ${projectId} and user_id = ${userId}`;
  return true;
}

export async function listAssets(projectId: string, userId: string): Promise<AssetRow[]> {
  if (!(await assertProjectOwner(projectId, userId))) return [];
  const sql = await getSql();
  return sql<AssetRow>`
    select id, project_id, user_id, kind, role, url, storage_key, prompt, view, title,
           created_at::text
    from project_assets
    where project_id = ${projectId} and user_id = ${userId}
    order by created_at desc
  `;
}

export async function addAsset(
  userId: string,
  data: {
    projectId: string;
    kind: string;
    url: string;
    prompt?: string;
    role?: string;
    view?: string;
    title?: string;
    storageKey?: string;
  },
): Promise<AssetRow | null> {
  if (!(await assertProjectOwner(data.projectId, userId))) return null;
  const sql = await getSql();
  const id = uid();
  await sql`
    insert into project_assets
      (id, project_id, user_id, kind, role, url, storage_key, prompt, view, title)
    values (
      ${id},
      ${data.projectId},
      ${userId},
      ${data.kind},
      ${data.role ?? null},
      ${data.url},
      ${data.storageKey ?? null},
      ${data.prompt ?? ""},
      ${data.view ?? null},
      ${data.title ?? null}
    )
  `;
  await sql`update projects set updated_at = now() where id = ${data.projectId} and user_id = ${userId}`;
  const rows = await sql<AssetRow>`
    select id, project_id, user_id, kind, role, url, storage_key, prompt, view, title,
           created_at::text
    from project_assets where id = ${id} and user_id = ${userId} limit 1
  `;
  return rows[0] ?? null;
}

export async function listTurns(projectId: string, userId: string): Promise<TurnRow[]> {
  if (!(await assertProjectOwner(projectId, userId))) return [];
  const sql = await getSql();
  return sql<TurnRow>`
    select id, project_id, user_id, role, text, kind, url, created_at::text
    from conversation_turns
    where project_id = ${projectId} and user_id = ${userId}
    order by created_at asc
  `;
}

export async function addTurn(
  userId: string,
  data: {
    projectId: string;
    role: string;
    text: string;
    kind?: string;
    url?: string;
  },
): Promise<TurnRow | null> {
  if (!(await assertProjectOwner(data.projectId, userId))) return null;
  const sql = await getSql();
  const id = uid();
  await sql`
    insert into conversation_turns (id, project_id, user_id, role, text, kind, url)
    values (
      ${id},
      ${data.projectId},
      ${userId},
      ${data.role},
      ${data.text},
      ${data.kind ?? null},
      ${data.url ?? null}
    )
  `;
  await sql`update projects set updated_at = now() where id = ${data.projectId} and user_id = ${userId}`;
  const rows = await sql<TurnRow>`
    select id, project_id, user_id, role, text, kind, url, created_at::text
    from conversation_turns where id = ${id} and user_id = ${userId} limit 1
  `;
  return rows[0] ?? null;
}
