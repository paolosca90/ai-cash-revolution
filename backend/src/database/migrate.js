import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection } from './connection.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');
async function createMigrationsTable() {
    await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}
async function getExecutedMigrations() {
    const result = await query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
}
async function getMigrationFiles() {
    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    return files.map(filename => {
        const match = filename.match(/^(\d+)_/);
        if (!match) {
            throw new Error(`Invalid migration filename: ${filename}`);
        }
        return {
            filename,
            version: parseInt(match[1])
        };
    });
}
async function executeMigration(migration) {
    const migrationPath = path.join(migrationsDir, migration.filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Executing migration: ${migration.filename}`);
    try {
        // Execute the migration SQL
        await query(sql);
        // Record the migration as executed
        await query('INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)', [migration.version, migration.filename]);
        console.log(`✅ Migration ${migration.filename} executed successfully`);
    }
    catch (error) {
        console.error(`❌ Migration ${migration.filename} failed:`, error);
        throw error;
    }
}
export async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        // Test database connection
        await testConnection();
        // Create migrations table if it doesn't exist
        await createMigrationsTable();
        // Get executed migrations
        const executedVersions = await getExecutedMigrations();
        console.log(`📋 Found ${executedVersions.length} executed migrations`);
        // Get all migration files
        const migrations = await getMigrationFiles();
        console.log(`📁 Found ${migrations.length} migration files`);
        // Execute pending migrations
        const pendingMigrations = migrations.filter(migration => !executedVersions.includes(migration.version));
        if (pendingMigrations.length === 0) {
            console.log('✨ No pending migrations to execute');
            return;
        }
        console.log(`⏳ Executing ${pendingMigrations.length} pending migrations...`);
        for (const migration of pendingMigrations) {
            await executeMigration(migration);
        }
        console.log('🎉 All migrations executed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().then(() => {
        process.exit(0);
    });
}
//# sourceMappingURL=migrate.js.map