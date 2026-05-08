const fs = require("fs");
const path = require("path");

const TARGETS = [
    { key: "lib-supabase", root: path.join("src", "lib", "supabase") },
    { key: "lib-auth", root: path.join("src", "lib", "auth") },
    { key: "domain", root: path.join("src", "domain") },
];

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
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

function extract(content, regex, group = 1) {
    return [...content.matchAll(regex)].map((m) => m[group]);
}

fs.mkdirSync("scratch", { recursive: true });

for (const target of TARGETS) {
    const files = walk(target.root).sort((a, b) => a.localeCompare(b));
    const rows = files.map((file) => {
        const content = fs.readFileSync(file, "utf8");
        const exportedFns = uniq(extract(content, /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)).join(", ");
        const dbTables = uniq(extract(content, /\.from\("([a-zA-Z0-9_]+)"\)/g)).join(", ");
        const rpcCalls = uniq(extract(content, /\.rpc\("([a-zA-Z0-9_]+)"\)/g)).join(", ");
        const wrappers = uniq(
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
            securityWrappers: wrappers || "none",
            exportedFunctions: exportedFns || "-",
        };
    });

    const outJson = path.join("scratch", `${target.key}-audit.json`);
    const outMd = path.join("scratch", `${target.key}-audit.md`);

    fs.writeFileSync(outJson, JSON.stringify(rows, null, 2), "utf8");

    const md = [
        `# ${target.key} Audit`,
        "",
        `Total files: ${rows.length}`,
        "",
        "| File | use server | Admin Client | Server Client | .from | rpc | tables | security wrappers |",
        "|---|---|---|---|---|---|---|---|",
        ...rows.map(
            (r) =>
                `| ${r.file} | ${r.useServer} | ${r.usesAdminClient} | ${r.usesServerClient} | ${r.directFrom} | ${r.rpc} | ${r.tables} | ${r.securityWrappers} |`
        ),
        "",
    ];
    fs.writeFileSync(outMd, md.join("\n"), "utf8");

    console.log(`${target.key.toUpperCase()}_FILES=${rows.length}`);
    console.log(`WROTE_JSON=${outJson}`);
    console.log(`WROTE_MD=${outMd}`);
}
