const fs = require("fs");
const path = require("path");

const ROOT = path.join("src", "app", "api");
const OUT_JSON = path.join("scratch", "api-route-audit.json");
const OUT_MD = path.join("scratch", "api-route-audit.md");

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p, files);
        else if (/^route\.(ts|tsx)$/.test(entry.name)) files.push(p);
    }
    return files;
}

function extract(content, regex) {
    return [...content.matchAll(regex)].map((m) => m[1]);
}

function has(content, regex) {
    return regex.test(content) ? "yes" : "no";
}

const files = walk(ROOT).sort((a, b) => a.localeCompare(b));

const rows = files.map((file) => {
    const content = fs.readFileSync(file, "utf8");
    const methods = [...new Set(extract(content, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g))].join(", ");

    const securityWrappers = extract(
        content,
        /(withAdminRoute|withUserAndCsrfToken|withUserAndCsrf|withAuthAndCsrf|withUserRoute|withSecurity|withCronOrAdmin|withCsrfToken|withAuth)\s*\(/g
    );

    return {
        route: file.replace(/\\/g, "/"),
        methods: methods || "-",
        security: securityWrappers.length ? [...new Set(securityWrappers)].join(", ") : "none",
        usesAdminClient: has(content, /createSupabaseAdminClient/),
        usesServerClient: has(content, /createSupabaseServerClient/),
        directFromQuery: has(content, /\.from\("/),
    };
});

fs.mkdirSync("scratch", { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");

const md = [
    "# API Route Audit",
    "",
    `Total routes: ${rows.length}`,
    "",
    "| Route | Methods | Security Wrapper | Admin Client | Server Client | Direct .from() |",
    "|---|---|---|---|---|---|",
    ...rows.map(
        (r) =>
            `| ${r.route} | ${r.methods} | ${r.security} | ${r.usesAdminClient} | ${r.usesServerClient} | ${r.directFromQuery} |`
    ),
    "",
];
fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

console.log(`ROUTES=${rows.length}`);
console.log(`WROTE_JSON=${OUT_JSON}`);
console.log(`WROTE_MD=${OUT_MD}`);
