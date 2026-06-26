import { NextResponse } from 'next/server';
import type { ZodSchema, ZodError, ZodTypeAny, z } from 'zod';

export function formatZodError(error: ZodError): { error: Record<string, string[] | undefined> } {
  return { error: error.flatten().fieldErrors };
}

export function validationResponse(error: ZodError): NextResponse {
  return NextResponse.json(formatZodError(error), { status: 400 });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ data: z.output<S> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: errorResponse('Invalid JSON body', 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { response: validationResponse(parsed.error) };
  }

  return { data: parsed.data };
}

export function parseSearchParams<S extends ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: S,
): { data: z.output<S> } | { response: NextResponse } {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { response: validationResponse(parsed.error) };
  }

  return { data: parsed.data };
}
