import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const rootDir = process.cwd();
const snapshotPath = path.resolve(rootDir, "database", "schema.snapshot.sql");
const tempSnapshotPath = `${snapshotPath}.tmp`;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!accessToken) {
    console.error("SUPABASE_ACCESS_TOKEN is required.");
    process.exit(1);
}

if (!dbUrl) {
    console.error("SUPABASE_DB_URL is required.");
    process.exit(1);
}

function run(command, args) {
    return spawnSync(command, args, {
        cwd: rootDir,
        encoding: "utf8",
        shell: false,
        env: {
            ...process.env,
            SUPABASE_ACCESS_TOKEN: accessToken,
        },
    });
}

function ensureNonEmptySnapshot(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Snapshot file was not created: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf8");
    if (!content.trim()) {
        throw new Error("Generated snapshot is empty. Aborting overwrite.");
    }
}

function printFailure(result, context) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();

    console.error(`❌ ${context}`);
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
}

try {
    if (fs.existsSync(tempSnapshotPath)) {
        fs.rmSync(tempSnapshotPath, { force: true });
    }

    console.log("🔄 Refreshing database/schema.snapshot.sql via Supabase CLI dump...");
    const dump = run("npx", [
        "supabase",
        "db",
        "dump",
        "--db-url",
        dbUrl,
        "--schema",
        "public",
        "--file",
        tempSnapshotPath,
    ]);

    if (dump.status !== 0) {
        printFailure(dump, "Schema dump failed.");
        process.exit(dump.status ?? 1);
    }

    ensureNonEmptySnapshot(tempSnapshotPath);
    fs.renameSync(tempSnapshotPath, snapshotPath);

    console.log("✅ Snapshot refreshed successfully:", path.relative(rootDir, snapshotPath));
    console.log("ℹ️ If you also need migration-style reconciliation, run `npx supabase db pull` separately after resolving remote migration drift.");
} catch (error) {
    if (fs.existsSync(tempSnapshotPath)) {
        fs.rmSync(tempSnapshotPath, { force: true });
    }

    console.error("❌ Snapshot refresh aborted.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
