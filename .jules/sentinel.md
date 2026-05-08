## 2024-05-08 - [XSS via JSON.stringify in ld+json]
**Vulnerability:** XSS vulnerability found in structured-data.tsx where `JSON.stringify()` was passed directly to `dangerouslySetInnerHTML` inside `<script type="application/ld+json">`.
**Learning:** `JSON.stringify` does not escape `<` characters. If user input contains `</script><script>...`, it closes the script tag early and executes arbitrary JavaScript.
**Prevention:** Always escape `<` as `\\u003c` when inserting JSON into HTML script tags: `JSON.stringify(data).replace(/</g, '\\u003c')`.
## 2024-05-08 - Regex Injection Vulnerability Fix
**Vulnerability:** Dynamic regular expression constructed with unescaped user input (or static lists) leading to possible Regex Injection.
**Learning:** Even when inputs are thought to be static or safe, injecting them directly into a `new RegExp()` constructor without escaping special characters (`.`, `*`, `+`, `?`, etc.) creates a fragility that can be exploited for ReDoS or bypass logic if those inputs ever become dynamic or contain regex syntax.
**Prevention:** Always use an `escapeRegExp` utility to escape all regex special characters before injecting variables into a regex constructor.
