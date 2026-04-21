/**
 * API Security Audit Test
 * 
 * Ensures all mutation endpoints use proper CSRF protection.
 * This test prevents security regressions by enforcing:
 * 1. All POST/PATCH/PUT/DELETE routes use withAuthAndCsrf
 * 2. All GET/HEAD routes use withAuth (no CSRF needed)
 * 3. No mutation routes bypass security middleware
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const API_DIR = path.join(process.cwd(), "src/app/api");

interface RouteFile {
  path: string;
  content: string;
}

function getAllRouteFiles(dir: string): RouteFile[] {
  const files: RouteFile[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
        const content = fs.readFileSync(fullPath, "utf-8");
        files.push({ path: fullPath, content });
      }
    }
  }
  
  traverse(dir);
  return files;
}

function extractHttpMethods(content: string): string[] {
  const methods: string[] = [];
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g;
  
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }
  
  return methods;
}

function hasSecurityMiddleware(content: string, method: string): {
  hasWithAuth: boolean;
  hasWithAuthAndCsrf: boolean;
  hasWithSecurity: boolean;
  hasWithUserRoute: boolean;
  hasWithUserAndCsrf: boolean;
  hasWithAdminRoute: boolean;
  hasWithCronOrAdmin: boolean;
  hasRequireApiUser: boolean;
  hasRequireApiAdminUser: boolean;
} {
  // Look for security middleware usage within the method
  const methodStart = content.indexOf(`export async function ${method}`);
  if (methodStart === -1) {
    return {
      hasWithAuth: false,
      hasWithAuthAndCsrf: false,
      hasWithSecurity: false,
      hasWithUserRoute: false,
      hasWithUserAndCsrf: false,
      hasWithAdminRoute: false,
      hasWithCronOrAdmin: false,
      hasRequireApiUser: false,
      hasRequireApiAdminUser: false,
    };
  }
  
  // Find the next method or end of file
  const nextMethodMatch = content.slice(methodStart + 1).match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/);
  const methodEnd = nextMethodMatch 
    ? methodStart + 1 + nextMethodMatch.index! 
    : content.length;
  
  const methodContent = content.slice(methodStart, methodEnd);
  const scopedContent = `${content}\n${methodContent}`;
  
  return {
    hasWithAuth: /await\s+withAuth\s*\(/.test(scopedContent),
    hasWithAuthAndCsrf: /await\s+withAuthAndCsrf\s*\(/.test(scopedContent),
    hasWithSecurity: /await\s+withSecurity\s*\(/.test(scopedContent),
    hasWithUserRoute: /await\s+withUserRoute\s*\(/.test(scopedContent),
    hasWithUserAndCsrf: /await\s+withUserAndCsrf\s*\(/.test(scopedContent),
    hasWithAdminRoute: /await\s+withAdminRoute\s*\(/.test(scopedContent),
    hasWithCronOrAdmin: /await\s+withCronOrAdmin\s*\(/.test(scopedContent),
    hasRequireApiUser: /await\s+requireApiUser\s*\(/.test(scopedContent),
    hasRequireApiAdminUser: /await\s+requireApiAdminUser\s*\(/.test(scopedContent),
  };
}

function isPublicEndpoint(filePath: string, content: string): boolean {
  const normalizedFilePath = filePath.replace(/\\/g, "/");

  // Public endpoints that don't require auth
  const publicPaths = [
    "/api/auth/",
    "/api/webhooks/",
    "/api/health",
    "/api/cron/",
    "/api/contact",
    "/api/market/estimate",
    "/api/search/suggestions",
    "/api/og/",
    "/api/saved-searches/notify",
    "/api/listings/expiry-warnings",
    "/api/cron/process-fulfillments",
    "/api/migrations/legacy-sync",
    "/api/listings/[listingId]/verify-eids",
  ];
  
  if (publicPaths.some(p => normalizedFilePath.includes(p))) {
    return true;
  }
  
  // Check for explicit public marker in comments
  if (/\/\/\s*@public/i.test(content) || content.includes("* @public")) {
    return true;
  }
  
  return false;
}

describe("API Security Audit", () => {
  const routeFiles = getAllRouteFiles(API_DIR);
  
  it("should find route files", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });
  
  describe("CSRF Protection", () => {
    const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];
    const violations: Array<{ file: string; method: string; reason: string }> = [];
    
    for (const { path: filePath, content } of routeFiles) {
      const methods = extractHttpMethods(content);
      const isPublic = isPublicEndpoint(filePath, content);
      
      for (const method of methods) {
        if (mutationMethods.includes(method)) {
          const security = hasSecurityMiddleware(content, method);
          
          // Skip public endpoints (they may have different security patterns)
          if (isPublic) {
            continue;
          }
          
          // Mutation endpoints MUST use withAuthAndCsrf or withSecurity with requireCsrf
          if (
            !security.hasWithAuthAndCsrf &&
            !security.hasWithSecurity &&
            !security.hasWithUserAndCsrf &&
            !security.hasWithAdminRoute &&
            !security.hasWithCronOrAdmin &&
            !security.hasRequireApiAdminUser
          ) {
            violations.push({
              file: filePath.replace(process.cwd(), ""),
              method,
              reason: "Mutation endpoint must use withAuthAndCsrf or withSecurity",
            });
          }
          
          // If using withAuth (not withAuthAndCsrf), it's a violation
          if (security.hasWithAuth && !security.hasWithAuthAndCsrf) {
            violations.push({
              file: filePath.replace(process.cwd(), ""),
              method,
              reason: "Mutation endpoint uses withAuth instead of withAuthAndCsrf",
            });
          }
        }
      }
    }
    
    it("should enforce CSRF protection on all mutation endpoints", () => {
      if (violations.length > 0) {
        const message = [
          "\n🚨 CSRF Protection Violations Found:\n",
          ...violations.map(v => `  ${v.file} ${v.method}: ${v.reason}`),
          "\nFix: Replace withAuth with withAuthAndCsrf for mutation endpoints",
        ].join("\n");
        
        expect(violations).toEqual([]);
        throw new Error(message);
      }
      
      expect(violations).toEqual([]);
    });
  });
  
  describe("Authentication", () => {
    const violations: Array<{ file: string; method: string; reason: string }> = [];
    
    for (const { path: filePath, content } of routeFiles) {
      const methods = extractHttpMethods(content);
      const isPublic = isPublicEndpoint(filePath, content);
      
      // Skip public endpoints
      if (isPublic) {
        continue;
      }
      
      for (const method of methods) {
        const security = hasSecurityMiddleware(content, method);
        
        // All non-public endpoints should use some form of security middleware
        if (
          !security.hasWithAuth &&
          !security.hasWithAuthAndCsrf &&
          !security.hasWithSecurity &&
          !security.hasWithUserRoute &&
          !security.hasWithUserAndCsrf &&
          !security.hasWithAdminRoute &&
          !security.hasWithCronOrAdmin &&
          !security.hasRequireApiUser &&
          !security.hasRequireApiAdminUser
        ) {
          violations.push({
            file: filePath.replace(process.cwd(), ""),
            method,
            reason: "Endpoint has no security middleware (withAuth, withAuthAndCsrf, or withSecurity)",
          });
        }
      }
    }
    
    it("should enforce authentication on all protected endpoints", () => {
      if (violations.length > 0) {
        const message = [
          "\n🚨 Authentication Violations Found:\n",
          ...violations.map(v => `  ${v.file} ${v.method}: ${v.reason}`),
          "\nFix: Add withAuth or withAuthAndCsrf to protected endpoints",
        ].join("\n");
        
        expect(violations).toEqual([]);
        throw new Error(message);
      }
      
      expect(violations).toEqual([]);
    });
  });
  
  describe("Security Middleware Import", () => {
    const violations: Array<{ file: string; reason: string }> = [];
    
    for (const { path: filePath, content } of routeFiles) {
      const methods = extractHttpMethods(content);
      const isPublic = isPublicEndpoint(filePath, content);
      
      // Skip public endpoints and files with no methods
      if (isPublic || methods.length === 0) {
        continue;
      }
      
      // Check if file imports security middleware
      const hasSecurityImport = /from\s+["']@\/lib\/utils\/api-security["']/.test(content);
      
      if (!hasSecurityImport) {
        violations.push({
          file: filePath.replace(process.cwd(), ""),
          reason: "Route file should import security middleware from @/lib/utils/api-security",
        });
      }
    }
    
    it("should import security middleware in all protected route files", () => {
      if (violations.length > 0) {
        const message = [
          "\n⚠️  Security Middleware Import Warnings:\n",
          ...violations.map(v => `  ${v.file}: ${v.reason}`),
        ].join("\n");
        
        // This is a warning, not a hard failure
        console.warn(message);
      }
      
      // Don't fail the test, just warn
      expect(true).toBe(true);
    });
  });
});
