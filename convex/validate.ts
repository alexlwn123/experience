import { LIMITS, PHASES, type Phase } from "./model";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function cleanText(input: unknown, field: string, max: number): Result<string> {
  if (typeof input !== "string") return { ok: false, error: `${field} must be a string` };
  const value = input.trim();
  if (value.length === 0) return { ok: false, error: `${field} is required` };
  if (value.length > max) return { ok: false, error: `${field} must be at most ${max} characters` };
  return { ok: true, value };
}

export function cleanUrl(input: unknown, field: string): Result<string> {
  const text = cleanText(input, field, LIMITS.url);
  if (!text.ok) return text;
  try {
    const url = new URL(text.value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: `${field} must be an http(s) URL` };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: `${field} must be a valid URL` };
  }
}

export function cleanPhase(input: unknown): Result<Phase> {
  const match = PHASES.find((phase) => phase === input);
  return match
    ? { ok: true, value: match }
    : { ok: false, error: `phase must be one of: ${PHASES.join(", ")}` };
}

export function assertAdmin(key: string) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) throw new Error("ADMIN_KEY is not configured");
  if (!safeEqual(key, expected)) throw new Error("Unauthorized");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diff = [...a].reduce((acc, char, i) => acc | (char.charCodeAt(0) ^ b.charCodeAt(i)), 0);
  return diff === 0;
}
