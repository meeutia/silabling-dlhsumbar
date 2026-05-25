const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const ROOT = path.resolve(__dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT, 'database', 'migrations');
const SEEDERS_DIR = path.join(ROOT, 'database', 'seeders');

const DB_NAME = process.env.DB_NAME || 'silabling.lab';
const CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
  multipleStatements: false,
};

function quoteIdentifier(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (lineComment) {
      current += ch;
      if (ch === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }

    if (quote) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '-' && next === '-') {
      current += ch + next;
      i += 1;
      lineComment = true;
      continue;
    }

    if (ch === '/' && next === '*') {
      current += ch + next;
      i += 1;
      blockComment = true;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements.filter((stmt) => stmt && !/^--/.test(stmt));
}

async function connectWithoutDatabase() {
  return mysql.createConnection(CONFIG);
}

async function connectWithDatabase() {
  const connection = await mysql.createConnection(CONFIG);
  await connection.query(`USE ${quoteIdentifier(DB_NAME)}`);
  return connection;
}

async function ensureDatabase() {
  const connection = await connectWithoutDatabase();
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(DB_NAME)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
  );
  await connection.end();
}

async function ensureTrackingTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      kind varchar(20) NOT NULL,
      filename varchar(255) NOT NULL,
      checksum varchar(64) NOT NULL,
      executed_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (kind, filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function alreadyExecuted(connection, kind, filename) {
  const [rows] = await connection.query(
    'SELECT checksum FROM schema_migrations WHERE kind = ? AND filename = ? LIMIT 1',
    [kind, filename]
  );
  return rows[0] || null;
}

async function markExecuted(connection, kind, filename, digest) {
  await connection.query(
    'INSERT INTO schema_migrations (kind, filename, checksum) VALUES (?, ?, ?)',
    [kind, filename, digest]
  );
}

async function runSqlFile(connection, filepath, kind) {
  const filename = path.basename(filepath);
  const rawContent = fs.readFileSync(filepath, 'utf8');
  const digest = checksum(rawContent);
  const content = rawContent
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const existing = await alreadyExecuted(connection, kind, filename);

  if (existing) {
    if (existing.checksum !== digest) {
      throw new Error(`${kind} ${filename} sudah pernah dijalankan, tetapi checksum berubah. Buat file baru untuk revisi migration/seeder.`);
    }
    console.log(`SKIP ${kind}: ${filename}`);
    return;
  }

  const statements = splitSqlStatements(content)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }

  await markExecuted(connection, kind, filename, digest);
  console.log(`DONE ${kind}: ${filename}`);
}

async function runJsSeeder(connection, filepath) {
  const filename = path.basename(filepath);
  const rawContent = fs.readFileSync(filepath, 'utf8');
  const digest = checksum(rawContent);
  const content = rawContent
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const existing = await alreadyExecuted(connection, 'seeder', filename);

  if (existing) {
    if (existing.checksum !== digest) {
      throw new Error(`seeder ${filename} sudah pernah dijalankan, tetapi checksum berubah. Buat file seeder baru untuk revisi data awal.`);
    }
    console.log(`SKIP seeder: ${filename}`);
    return;
  }

  const seeder = require(filepath);
  if (!seeder || typeof seeder.up !== 'function') {
    throw new Error(`Seeder JS ${filename} harus export { up }.`);
  }

  await seeder.up({ connection, dbName: DB_NAME });
  await markExecuted(connection, 'seeder', filename, digest);
  console.log(`DONE seeder: ${filename}`);
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(ext))
    .sort()
    .map((name) => path.join(dir, name));
}

async function migrate() {
  await ensureDatabase();
  const connection = await connectWithDatabase();
  await ensureTrackingTable(connection);
  for (const file of listFiles(MIGRATIONS_DIR, '.sql')) {
    await runSqlFile(connection, file, 'migration');
  }
  await connection.end();
}

async function seed() {
  await ensureDatabase();
  const connection = await connectWithDatabase();
  await ensureTrackingTable(connection);

  for (const file of listFiles(SEEDERS_DIR, '.js')) {
    await runJsSeeder(connection, file);
  }
  for (const file of listFiles(SEEDERS_DIR, '.sql')) {
    await runSqlFile(connection, file, 'seeder');
  }

  await connection.end();
}

async function status() {
  await ensureDatabase();
  const connection = await connectWithDatabase();
  await ensureTrackingTable(connection);
  const [rows] = await connection.query('SELECT kind, filename, executed_at FROM schema_migrations ORDER BY kind, filename');
  if (!rows.length) {
    console.log('Belum ada migration/seeder yang tercatat.');
  } else {
    console.table(rows);
  }
  await connection.end();
}

async function main() {
  const command = process.argv[2];
  if (command === 'migrate') return migrate();
  if (command === 'seed') return seed();
  if (command === 'setup') {
    await migrate();
    await seed();
    return;
  }
  if (command === 'status') return status();

  console.log('Usage: node src/database/db-runner.js <migrate|seed|setup|status>');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
