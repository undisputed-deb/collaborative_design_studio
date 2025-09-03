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

    // Add optional page parameter for multi-page whiteboards (default 0)
    const pageParam = searchParams.get('page');
    const page = Number.isFinite(Number(pageParam)) && Number(pageParam) >= 0 ? Number(pageParam) : 0;

    const col = db.collection('projectStates');
    const docId = `${projectId}__${page}`;
    let doc = await col.doc(docId).get();

    // Backward compatibility: if requesting page 0 and no paged doc exists, fall back to legacy single-doc state
    if (!doc.exists && page === 0) {
      const legacy = await col.doc(projectId).get();
      if (legacy.exists) doc = legacy;
    }

    if (!doc.exists) {
      return NextResponse.json({ version: 0, data: { shapes: [] }, updatedAt: null });
    }

    return NextResponse.json({ id: doc.id, ...(doc.data() as Record<string, unknown>) });
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

    const data = body?.data as unknown;
    const baseVersion: number = typeof body?.baseVersion === 'number' ? body.baseVersion : 0;

    // Optional page parameter for multi-page support (default 0)
    const pageRaw = body?.page;
    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) >= 0 ? Number(pageRaw) : 0;

    // Get current for the specific page doc
    const col = db.collection('projectStates');
    const docId = `${projectId}__${page}`;
    const ref = col.doc(docId);
    const current = await ref.get();
    const currentVersion = current.exists ? (current.data() as { version: number }).version : -1;

    const nextVersion = Math.max(currentVersion + 1, baseVersion + 1);

    await ref.set({
      version: nextVersion,
      data,
      updatedAt: db.FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    });

    return NextResponse.json({ success: true, version: nextVersion });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'UNAUTH') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}