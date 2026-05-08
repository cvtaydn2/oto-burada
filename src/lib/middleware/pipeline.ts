import { type NextRequest, NextResponse } from "next/server";

export type MiddlewareResult = NextResponse | null | undefined;
export type MiddlewareFunction = (
  request: NextRequest
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Orchestrates a sequence of middleware functions.
 * Stops at the first middleware that returns a NextResponse.
 * If all middlewares return null/undefined, proceeds with NextResponse.next().
 */
export async function runMiddlewarePipeline(
  request: NextRequest,
  middlewares: MiddlewareFunction[]
): Promise<NextResponse> {
  for (const middleware of middlewares) {
    const result = await middleware(request);
    if (result instanceof NextResponse) {
      return result;
    }
  }
  return NextResponse.next();
}
