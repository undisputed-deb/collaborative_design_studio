import { NextResponse } from 'next/server';
import { getServerSession } from 'cosmic-authentication';

export async function POST(req: Request) {
  try {
    // Optional auth: allow unauthenticated calls for chat-only replies
    const user = await getServerSession().catch(() => null);

    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    const shapes = body?.shapes as unknown;
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // No auto-actions: only return a chat message.
      return NextResponse.json({
        message:
          'AI is not configured. I\'ll share suggestions here in chat only. Nothing was added to your board.',
      });
    }

    // Compose a concise instruction with a request for optional ACTIONS JSON
    const sys = 'You are a friendly whiteboard design assistant. Provide concise, actionable suggestions. Keep replies suitable for chat display. Do NOT perform any automatic actions on a board.';

    const fullPrompt = `${sys}\n\nPROMPT: ${prompt}\nCURRENT_SHAPES: ${JSON.stringify(shapes).slice(0, 6000)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: fullPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ message: `AI error: ${t}` }, { status: 200 });
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const content = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim() || 'No response';

    return NextResponse.json({ message: content, userId: user?.uid ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}