// =============================================================================
// app/api/ticketing/queue-status/route.ts
// GET — Waiting room queue status check (polled by /queue page every 5 seconds)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';   // Lightweight — runs on Vercel Edge
export const dynamic = 'force-dynamic'; // This route is always dynamic (reads Redis + cookies)

interface QueueStatusResponse {
  admitted:         boolean;
  position:         number;
  estimatedSeconds: number;
  total:            number;
}

async function redisGet<T>(key: string): Promise<T | null> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res  = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache:   'no-store',
    });
    const json = await res.json() as { result: T };
    return json.result ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventSlug = searchParams.get('event') ?? 'global';
  const sessionKey = `active_sessions:${eventSlug}`;
  const maxSessions = parseInt(process.env.QUEUE_MAX_SESSIONS ?? '500', 10);

  // If Upstash is not configured, always admit
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return NextResponse.json<QueueStatusResponse>({
      admitted:         true,
      position:         0,
      estimatedSeconds: 0,
      total:            0,
    });
  }

  // Check current session count
  const currentSessions = parseInt((await redisGet<string>(sessionKey)) ?? '0', 10);

  // If user has a valid queue token cookie, they're admitted
  const queueToken = request.cookies.get('zt_queue_token')?.value;
  const isAdmitted = !!queueToken || currentSessions <= maxSessions;

  const position         = Math.max(0, currentSessions - maxSessions);
  const estimatedSeconds = position * 2; // ~2 seconds per position (token bucket rate: 1/sec, batch processing)

  return NextResponse.json<QueueStatusResponse>({
    admitted:         isAdmitted,
    position,
    estimatedSeconds,
    total:            currentSessions,
  });
}
