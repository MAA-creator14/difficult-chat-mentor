import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationType, transcript } = body;

  const transcriptText = (transcript as Array<{ role: string; content: string }>)
    .map((msg) => `**${msg.role.toUpperCase()}:** ${msg.content}`)
    .join('\n\n');

  const anthropic = createAnthropic({ apiKey });

  try {
    const { text } = await generateText({
      model: anthropic('claude-opus-4-6'),
      system: `You are an expert executive coach providing a debrief after a practice conversation.

Analyze what went well and what could be improved. Focus on:
- Clarity and directness of communication
- Emotional tone and empathy
- Handling of objections or resistance
- Staying on message vs. getting derailed
- Key moments to watch for in the real conversation

Be specific and actionable. Keep the debrief concise (3-5 key points).`,
      messages: [
        {
          role: 'user',
          content: `Here's the practice ${conversationType} conversation transcript:

${transcriptText}

Provide a brief debrief with specific feedback.`,
        },
      ],
    });

    return Response.json({ text });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('invalid_api_key') || error.message.includes('401'))) {
      return Response.json({ error: 'Invalid API key. Please check your Anthropic API key in Settings.' }, { status: 401 });
    }
    return Response.json({ error: 'Failed to generate debrief. Please try again.' }, { status: 500 });
  }
}
