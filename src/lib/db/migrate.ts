import { getDb } from "./index";
import fs from "node:fs";
import path from "node:path";

export function runMigrations(): void {
  const db = getDb();
  const schemaPath = path.join(process.cwd(), "src/lib/db/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema);
  console.log("Database migrations completed successfully.");
}

// Run directly via: npx tsx src/lib/db/migrate.ts
if (require.main === module) {
  runMigrations();
}
