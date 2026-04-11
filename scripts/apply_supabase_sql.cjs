const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function findConnectionString(envText) {
  const match = envText.match(/postgres(?:ql)?:\/\/[^\s"']+/i);
  return match ? match[0] : null;
}

async function run() {
  const direct = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) {
    await applyWithConnection(direct);
    return;
  }
  const envPath = path.resolve(process.cwd(), ".env");
  const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const connectionString = findConnectionString(envText);
  if (!connectionString) {
    throw new Error("No postgres connection string found in .env");
  }

  await applyWithConnection(connectionString);
}

async function applyWithConnection(connectionString) {
  const sqlFiles = [
    path.resolve(process.cwd(), "supabase", "schema.sql"),
    path.resolve(process.cwd(), "supabase", "rls.sql"),
    path.resolve(process.cwd(), "supabase", "realtime.sql"),
  ];

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    for (const file of sqlFiles) {
      if (!fs.existsSync(file)) continue;
      const sql = fs.readFileSync(file, "utf8");
      if (!sql.trim()) continue;
      await client.query(sql);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
