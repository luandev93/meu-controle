import { neon } from '@neondatabase/serverless';

const connection = (process.env.DATABASE_URL || '').trim();

export const database = connection ? neon(connection) : null;

let schemaReady;

async function ensureSchema() {
  if (!database) throw new Error('DATABASE_URL not configured');
  if (!schemaReady) {
    schemaReady = database.query(`
      create table if not exists public.app_state (
        id integer primary key,
        data jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      )
    `).catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function readStateRecord() {
  await ensureSchema();
  const rows = await database.query(
    'select data, updated_at from public.app_state where id = $1',
    [1]
  );

  if (rows[0]) return rows[0];

  return {
    data: {
      debts: [],
      shifts: [],
      scheduleConfig: {
        hmsm: { enabled: true, anchor: '', intervalValue: 3, unit: 'dias' },
        hmmv: { enabled: true, weekdays: [2, 4, 6], firstSunday: true }
      }
    },
    updated_at: new Date().toISOString()
  };
}

export async function readState() {
  const record = await readStateRecord();
  return record.data;
}

export async function writeState(data) {
  await ensureSchema();
  const rows = await database.query(
    'insert into public.app_state (id, data, updated_at) values ($1, $2::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now() returning updated_at',
    [1, JSON.stringify(data)]
  );
  return rows[0]?.updated_at ?? new Date().toISOString();
}
