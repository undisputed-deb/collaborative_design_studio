import { NextResponse } from 'next/server';
import { db } from 'cosmic-database';
import { getServerSession } from 'cosmic-authentication';

export async function POST(req: Request) {
  try {
    const user = await getServerSession();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await req.json();
    const { projectId, email } = body as { projectId?: string; email?: string };
    if (!projectId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Only owner can invite
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectDoc.data() as { ownerId: string };
    if (project.ownerId !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Find user by email
    const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (usersSnap.empty) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const invitedUserId = usersSnap.docs[0].id;

    const membershipId = `${projectId}_${invitedUserId}`;
    await db.collection('projectMemberships').doc(membershipId).set({
      userId: invitedUserId,
      projectId,
      role: 'editor',
      createdAt: db.FieldValue.serverTimestamp(),
      updatedAt: db.FieldValue.serverTimestamp(),
      invitedBy: user.uid,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
