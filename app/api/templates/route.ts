import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';
import { getTemplatePreset } from '@/lib/templates';

async function requireUser() {
  const user = await getServerSession();
  if (!user) throw new Error('UNAUTH');
  return user;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const slug: string | undefined = body?.template;
    const name: string | undefined = (body?.name as string | undefined)?.trim();
    if (!slug) return NextResponse.json({ error: 'Missing template' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Project name required' }, { status: 400 });

    const preset = getTemplatePreset(slug);
    if (!preset) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

    // Create project
    const projectRef = await db.collection('projects').add({
      name,
      ownerId: user.uid,
      folder: 'Templates',
      tags: [preset.title],
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    });
    const projectId = projectRef.id;

    // Owner membership (deterministic id)
    const membershipId = `${projectId}_${user.uid}`;
    await db.collection('projectMemberships').doc(membershipId).set({
      userId: user.uid,
      projectId,
      role: 'owner',
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    });

    // Initial state with preset shapes
    await db.collection('projectStates').doc(projectId).set({
      version: 0,
      data: { shapes: preset.shapes },
      updatedAt: db.FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    });

    return NextResponse.json({ id: projectId });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'UNAUTH') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
