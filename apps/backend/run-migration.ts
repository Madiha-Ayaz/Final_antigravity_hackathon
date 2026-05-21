import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_bdflQ1gx7qYz@ep-dry-smoke-aqh2syx4-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Reading migration file...');
    const migrationPath = join(
      __dirname,
      'src',
      'db',
      'migrations',
      '003_update_emergency_contacts.sql'
    );
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
