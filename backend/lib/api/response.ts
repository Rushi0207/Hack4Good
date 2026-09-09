import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ForbiddenError, UnauthenticatedError } from '@/lib/auth/authorization';

/** Wraps a value in a standard 200 JSON response. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Maps known error types to appropriate HTTP status codes. Never leaks internals. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthenticatedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: err.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Log unexpected errors server-side but never expose internals.
  console.error('[api-error]', err);
  return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
}

/** Produces a 404 Not Found response. */
export function notFound(message = 'Resource not found.'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Produces a 409 Conflict response. */
export function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 409 });
}

/** Produces a 400 Bad Request response. */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
