import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';

// Helper: require auth
async function requireUser() {
  const user = await getServerSession();
  if (!user) throw new Error('UNAUTH');
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();

    // Get memberships for this user
    const membershipsSnap = await db
      .collection('projectMemberships')
      .where('userId', '==', user.uid)
      .get();

    const memberships = membershipsSnap.docs.map((d) => d.data() as { projectId: string; role: string });
    const projectIds = Array.from(new Set(memberships.map((m) => m.projectId)));

    // Fetch each project by id
    const projects = await Promise.all(
      projectIds.map(async (pid) => {
        const doc = await db.collection('projects').doc(pid).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...(doc.data() as Record<string, unknown>) };
      })
    );

    return NextResponse.json({ projects: projects.filter(Boolean) });
  } catch (e) {
    if ((e as Error).message === 'UNAUTH') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const name: string = body?.name || 'Untitled Project';
    const folder: string = body?.folder || 'General';
    const tags: string[] = Array.isArray(body?.tags) ? body.tags.slice(0, 6) : [];

    const projectRef = await db.collection('projects').add({
      name,
      ownerId: user.uid,
      folder,
      tags,
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    });

    const projectId = projectRef.id;

    // Create membership for owner using deterministic id to avoid duplicates
    const membershipId = `${projectId}_${user.uid}`;
    await db.collection('projectMemberships').doc(membershipId).set({
      userId: user.uid,
      projectId,
      role: 'owner',
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
    });

    // Initialize empty state
    await db.collection('projectStates').doc(projectId).set({
      version: 0,
      data: { shapes: [] },
      updatedAt: db.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: projectId });
  } catch (e) {
    if ((e as Error).message === 'UNAUTH') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Only owner can delete
    const projectDoc = await db.collection('projects').doc(id).get();
    if (!projectDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const project = projectDoc.data() as { ownerId: string };
    if (project.ownerId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete project doc
    await db.collection('projects').doc(id).delete();

    // Delete state doc
    await db.collection('projectStates').doc(id).delete();

    // Delete memberships (single-field query)
    const memSnap = await db
      .collection('projectMemberships')
      .where('projectId', '==', id)
      .limit(200)
      .get();
    const batch = db.batch();
    memSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === 'UNAUTH') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const id: string | undefined = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (typeof body?.name === 'string') updates.name = body.name as string;
    if (typeof body?.folder === 'string') updates.folder = body.folder as string;
    if (Array.isArray(body?.tags)) updates.tags = (body.tags as unknown[]).slice(0, 6);

    const doc = await db.collection('projects').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const project = doc.data() as { ownerId: string };
    if (project.ownerId !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.collection('projects').doc(id).update({ ...updates, updatedAt: db.FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === 'UNAUTH') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}