import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';

async function requireMember(projectId: string) {
  const user = await getServerSession();
  if (!user) throw new Error('UNAUTH');
  const memId = `${projectId}_${user.uid}`;
  const mem = await db.collection('projectMemberships').doc(memId).get();
  if (!mem.exists) throw new Error('FORBIDDEN');
  return user;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    await requireMember(projectId);

    const snap = await db.collection('comments')
      .where('projectId', '==', projectId)
      .limit(500)
      .get();

    const comments = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    return NextResponse.json({ comments });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'UNAUTH') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId: string | undefined = body?.projectId;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const user = await requireMember(projectId);

    const text: string | undefined = body?.text;
    if (!text || !text.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const parentId: string | null = body?.parentId ?? null;
    const x: number | undefined = typeof body?.x === 'number' ? body.x : undefined;
    const y: number | undefined = typeof body?.y === 'number' ? body.y : undefined;

    // Root pin requires coordinates
    if (!parentId && (typeof x !== 'number' || typeof y !== 'number')) {
      return NextResponse.json({ error: 'Missing coordinates for pin' }, { status: 400 });
    }

    const payload = {
      projectId,
      text,
      parentId: parentId || null,
      // Coordinates only for pin roots
      x: parentId ? null : x ?? null,
      y: parentId ? null : y ?? null,
      authorId: user.uid,
      authorName: (user as { displayName?: string }).displayName || 'Anonymous',
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('comments').add(payload);

    return NextResponse.json({ success: true, id: ref.id });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'UNAUTH') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
