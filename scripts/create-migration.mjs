/**
 * Migration Generator for OtoBurada
 * 
 * Creates new migration files with proper naming, templates, and UP/DOWN structure
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const migrationsDir = path.resolve(process.cwd(), "database", "migrations");

function getNextMigrationNumber() {
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return "0001";
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .map(f => {
      const match = f.match(/^(\d{4})_/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => b - a);

  const nextNumber = (files[0] || 0) + 1;
  return nextNumber.toString().padStart(4, "0");
}

function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 50);
}

function generateMigrationTemplate(name, type = "general") {
  const templates = {
    table: `-- Create new table: ${name}
-- UP
CREATE TABLE IF NOT EXISTS public.${name} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policy
ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_${name}_created_at ON public.${name}(created_at);

-- DOWN
DROP TABLE IF EXISTS public.${name};`,

    column: `-- Add column to existing table
-- UP
ALTER TABLE public.existing_table 
ADD COLUMN IF NOT EXISTS new_column_name text;

-- Add index if needed
CREATE INDEX IF NOT EXISTS idx_existing_table_new_column 
ON public.existing_table(new_column_name);

-- DOWN
ALTER TABLE public.existing_table 
DROP COLUMN IF EXISTS new_column_name;`,

    index: `-- Add database indexes for performance
-- UP
CREATE INDEX IF NOT EXISTS idx_${name} 
ON public.table_name(column_name);

-- Add partial index example
CREATE INDEX IF NOT EXISTS idx_${name}_partial 
ON public.table_name(column_name) 
WHERE condition = true;

-- DOWN
DROP INDEX IF EXISTS public.idx_${name};
DROP INDEX IF EXISTS public.idx_${name}_partial;`,

    function: `-- Add database function/RPC
-- UP
CREATE OR REPLACE FUNCTION public.${name}()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation
  RAISE NOTICE 'Function ${name} executed';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.${name}() TO authenticated;

-- DOWN
DROP FUNCTION IF EXISTS public.${name}();`,

    rls: `-- Add Row Level Security policies
-- UP
-- Enable RLS on table
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "${name}_select_policy" ON public.table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "${name}_insert_policy" ON public.table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "${name}_update_policy" ON public.table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "${name}_delete_policy" ON public.table_name
  FOR DELETE USING (auth.uid() = user_id);

-- DOWN
DROP POLICY IF EXISTS "${name}_select_policy" ON public.table_name;
DROP POLICY IF EXISTS "${name}_insert_policy" ON public.table_name;
DROP POLICY IF EXISTS "${name}_update_policy" ON public.table_name;
DROP POLICY IF EXISTS "${name}_delete_policy" ON public.table_name;`,

    general: `-- ${name}
-- UP
-- Add your migration SQL here
-- Example:
-- ALTER TABLE public.listings ADD COLUMN new_field text;
-- CREATE INDEX IF NOT EXISTS idx_listings_new_field ON public.listings(new_field);

-- DOWN
-- Add rollback SQL here
-- Example:
-- DROP INDEX IF EXISTS public.idx_listings_new_field;
-- ALTER TABLE public.listings DROP COLUMN IF EXISTS new_field;`
  };

  return templates[type] || templates.general;
}

function createMigration(name, type = "general") {
  if (!name) {
    console.error("❌ Migration name is required");
    console.log("Usage: node create-migration.mjs <name> [type]");
    console.log("Types: table, column, index, function, rls, general");
    process.exit(1);
  }

  const sanitizedName = sanitizeName(name);
  const migrationNumber = getNextMigrationNumber();
  const filename = `${migrationNumber}_${sanitizedName}.sql`;
  const filePath = path.join(migrationsDir, filename);

  if (fs.existsSync(filePath)) {
    console.error(`❌ Migration file already exists: ${filename}`);
    process.exit(1);
  }

  const template = generateMigrationTemplate(sanitizedName, type);
  
  fs.writeFileSync(filePath, template);
  
  console.log("✅ Migration created successfully!");
  console.log(`📁 File: ${filename}`);
  console.log(`📍 Path: ${filePath}`);
  console.log(`🏷️  Type: ${type}`);
  console.log("\n📝 Next steps:");
  console.log("1. Edit the migration file to add your SQL");
  console.log("2. Test the migration: node scripts/migration-manager.mjs validate");
  console.log("3. Apply the migration: node scripts/migration-manager.mjs migrate");
  
  return filePath;
}

// CLI Interface
function main() {
  const name = process.argv[2];
  const type = process.argv[3] || "general";

  if (!name) {
    console.log("🗃️  OtoBurada Migration Generator");
    console.log("Usage: node create-migration.mjs <name> [type]");
    console.log("\nAvailable types:");
    console.log("  table     - Create new table with RLS");
    console.log("  column    - Add column to existing table");
    console.log("  index     - Add database indexes");
    console.log("  function  - Add database function/RPC");
    console.log("  rls       - Add Row Level Security policies");
    console.log("  general   - General migration template (default)");
    console.log("\nExamples:");
    console.log("  node create-migration.mjs add_user_preferences table");
    console.log("  node create-migration.mjs add_email_column column");
    console.log("  node create-migration.mjs optimize_listings_query index");
    process.exit(0);
  }

  createMigration(name, type);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createMigration };