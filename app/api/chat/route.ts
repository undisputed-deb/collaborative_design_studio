import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const snap = await db.collection('messages')
      .where('projectId', '==', projectId)
      .limit(200)
      .get();

    const messages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    return NextResponse.json({ messages });
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
    const text: string | undefined = body?.text;

    if (!projectId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const payload = {
      projectId,
      text,
      authorId: user.uid,
      authorName: (user as { displayName?: string }).displayName || 'User',
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('messages').add(payload);

    return NextResponse.json({ success: true, id: ref.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
