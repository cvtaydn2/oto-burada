const fs = require("fs");
const path = require("path");

const ROOT = path.join("src", "services");
const OUT_JSON = path.join("scratch", "services-audit.json");
const OUT_MD = path.join("scratch", "services-audit.md");

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p, files);
        else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) files.push(p);
    }
    return files;
}

function uniq(arr) {
    return [...new Set(arr)];
}

function extract(content, regex, groupIndex = 1) {
    return [...content.matchAll(regex)].map((m) => m[groupIndex]);
}

const files = walk(ROOT).sort((a, b) => a.localeCompare(b));

const rows = files.map((file) => {
    const content = fs.readFileSync(file, "utf8");

    const exportedFns = uniq(
        extract(content, /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)
    ).join(", ");

    const dbTables = uniq(extract(content, /\.from\("([a-zA-Z0-9_]+)"\)/g)).join(", ");
    const rpcCalls = uniq(extract(content, /\.rpc\("([a-zA-Z0-9_]+)"\)/g)).join(", ");

    const securityWrappers = uniq(
        extract(
            content,
            /(withAdminRoute|withUserAndCsrfToken|withUserAndCsrf|withAuthAndCsrf|withUserRoute|withSecurity|withCronOrAdmin|withCsrfToken|withAuth)\s*\(/g
        )
    ).join(", ");

    return {
        file: file.replace(/\\/g, "/"),
        useServer: /"use server"|'use server'/.test(content) ? "yes" : "no",
        usesAdminClient: /createSupabaseAdminClient/.test(content) ? "yes" : "no",
        usesServerClient: /createSupabaseServerClient/.test(content) ? "yes" : "no",
        directFrom: /\.from\("/.test(content) ? "yes" : "no",
        rpc: rpcCalls || "-",
        tables: dbTables || "-",
        securityWrappers: securityWrappers || "none",
        exportedFunctions: exportedFns || "-",
    };
});

fs.mkdirSync("scratch", { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");

const md = [
    "# Services Audit",
    "",
    `Total service files: ${rows.length}`,
    "",
    "| File | use server | Admin Client | Server Client | .from | rpc | tables | security wrappers |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map(
        (r) =>
            `| ${r.file} | ${r.useServer} | ${r.usesAdminClient} | ${r.usesServerClient} | ${r.directFrom} | ${r.rpc} | ${r.tables} | ${r.securityWrappers} |`
    ),
    "",
];

fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

console.log(`FILES=${rows.length}`);
console.log(`WROTE_JSON=${OUT_JSON}`);
console.log(`WROTE_MD=${OUT_MD}`);
