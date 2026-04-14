import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationType, context, behavior } = body;

  const anthropic = createAnthropic({ apiKey });

  try {
    const { text } = await generateText({
      model: anthropic('claude-opus-4-6'),
      system: `You are an expert executive coach. Generate 2-3 opening lines for a difficult conversation.
Each opener should be:
- Direct but respectful
- Specific to the situation
- Set the right tone for the conversation type
- Short (1-2 sentences each)

Return ONLY the opening lines, numbered 1-3, without extra commentary.`,
      messages: [
        {
          role: 'user',
          content: `Generate opening lines for a ${conversationType} conversation:

**Context:** ${context}
**Behavior:** ${behavior}

Provide 3 different opening lines.`,
        },
      ],
    });

    const lines = text
      .split('\n')
      .filter((line) => /^\d+\./.test(line.trim()))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim());

    return Response.json({ lines });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[openers] error:', msg);
    if (msg.includes('invalid_api_key') || msg.includes('401')) {
      return Response.json({ error: 'Invalid API key. Please check your Anthropic API key in Settings.' }, { status: 401 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
