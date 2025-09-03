import { NextResponse } from 'next/server';

export async function GET() {
  // Simple dynamic-ish metrics; in production, back by DB or analytics
  const base = 1000;
  const now = Date.now();
  const seed = Math.floor((now / 1000) % 1000);
  const rand = (n: number) => base + ((seed * n) % 3000);
  return NextResponse.json({
    activeUsers: rand(7),
    boardsCreated: rand(11),
    shapesDrawn: rand(13) * 4,
    uptimeDays: Math.floor(now / (1000 * 60 * 60 * 24)) % 365,
  });
}
