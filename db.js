import { neon } from '@neondatabase/serverless';

const connection = process.env.DATABASE_URL;

export const database = connection ? neon(connection) : null;

export async function readState() {
  if (!database) throw new Error('DATABASE_URL not configured');
  const rows = await database('select data from app_state where id = $1', [1]);
  return rows[0]?.data ?? { debts: [], shifts: [], scheduleConfig: {} };
}

export async function writeState(data) {
  if (!database) throw new Error('DATABASE_URL not configured');
  await database('insert into app_state (id, data, updated_at) values ($1, $2::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now()', [1, JSON.stringify(data)]);
}
