import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const snap = await db.collection('projectHistory')
      .where('projectId', '==', projectId)
      .limit(100)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    return NextResponse.json({ history: items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const projectId: string | undefined = body?.projectId;
    const label: string = body?.label || 'Snapshot';
    const data = body?.data as unknown;
    if (!projectId || !data) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const payload = {
      projectId,
      label,
      data,
      authorId: user.uid,
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('projectHistory').add(payload);

    return NextResponse.json({ success: true, id: ref.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
