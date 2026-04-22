import { describe, expect, it } from "vitest";

import { escapeHtml, sanitizeDescription, sanitizeForMeta, sanitizeText } from "../sanitize";

describe("sanitize utilities", () => {
  describe("sanitizeText", () => {
    it("returns empty string for empty input", () => {
      expect(sanitizeText("")).toBe("");
    });

    it("strips basic HTML tags", () => {
      expect(sanitizeText("<b>bold</b>")).toBe("bold");
      expect(sanitizeText("<p>paragraph</p>")).toBe("paragraph");
    });

    it("strips script tags and their content entirely", () => {
      expect(sanitizeText('<script>alert("xss")</script>hello')).toBe("hello");
      expect(sanitizeText('<script src="evil.js"></script>safe')).toBe("safe");
    });

    it("strips style tags and their content entirely", () => {
      expect(sanitizeText("<style>body{color:red}</style>text")).toBe("text");
    });

    it("strips nested tags", () => {
      expect(sanitizeText("<div><span>text</span></div>")).toBe("text");
    });

    it("handles XSS via entity encoding attempt", () => {
      // Attacker tries to hide script via &lt;script&gt;
      const input = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const result = sanitizeText(input);
      // After decoding entities, the second pass strips the resulting tags
      expect(result).not.toContain("<script>");
    });

    it("preserves plain text content", () => {
      expect(sanitizeText("BMW 320i 2020 model")).toBe("BMW 320i 2020 model");
    });

    it("handles img onerror XSS vector", () => {
      expect(sanitizeText("<img src=x onerror=alert(1)>")).toBe("");
    });

    it("handles svg/onload XSS vector", () => {
      expect(sanitizeText("<svg onload=alert(1)>")).toBe("");
    });

    it("handles javascript: protocol in href", () => {
      // The tag itself is stripped; the text content remains
      expect(sanitizeText('<a href="javascript:alert(1)">click</a>')).toBe("click");
    });
  });

  describe("sanitizeDescription", () => {
    it("preserves newlines", () => {
      const input = "Line 1\nLine 2\nLine 3";
      expect(sanitizeDescription(input)).toBe("Line 1\nLine 2\nLine 3");
    });

    it("strips HTML but keeps text", () => {
      expect(sanitizeDescription("<p>Para 1</p>\n<p>Para 2</p>")).toBe("Para 1\nPara 2");
    });

    it("strips script tags from descriptions", () => {
      const input = "Good car\n<script>steal()</script>\nClean interior";
      expect(sanitizeDescription(input)).toBe("Good car\n\nClean interior");
    });
  });

  describe("sanitizeForMeta", () => {
    it("collapses multiple spaces", () => {
      expect(sanitizeForMeta("hello   world")).toBe("hello world");
    });

    it("collapses newlines into spaces", () => {
      expect(sanitizeForMeta("line1\nline2\r\nline3")).toBe("line1 line2 line3");
    });

    it("trims leading and trailing whitespace", () => {
      expect(sanitizeForMeta("  hello  ")).toBe("hello");
    });

    it("strips HTML tags", () => {
      expect(sanitizeForMeta("<h1>Title</h1>")).toBe("Title");
    });
  });

  describe("escapeHtml", () => {
    it("escapes ampersand", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("escapes less-than and greater-than", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("it's")).toBe("it&#x27;s");
    });

    it("handles all special chars together", () => {
      expect(escapeHtml("<a href=\"x\" onclick='y'>a & b</a>")).toBe(
        "&lt;a href=&quot;x&quot; onclick=&#x27;y&#x27;&gt;a &amp; b&lt;/a&gt;"
      );
    });

    it("returns unchanged string with no special chars", () => {
      expect(escapeHtml("hello world 123")).toBe("hello world 123");
    });
  });
});
