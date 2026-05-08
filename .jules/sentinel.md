## 2024-05-08 - [XSS via JSON.stringify in ld+json]
**Vulnerability:** XSS vulnerability found in structured-data.tsx where `JSON.stringify()` was passed directly to `dangerouslySetInnerHTML` inside `<script type="application/ld+json">`.
**Learning:** `JSON.stringify` does not escape `<` characters. If user input contains `</script><script>...`, it closes the script tag early and executes arbitrary JavaScript.
**Prevention:** Always escape `<` as `\\u003c` when inserting JSON into HTML script tags: `JSON.stringify(data).replace(/</g, '\\u003c')`.
