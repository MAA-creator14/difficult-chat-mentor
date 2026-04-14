import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationType, context, behavior, impact, outcome, talkingPoints } = body;

  const anthropic = createAnthropic({ apiKey });

  try {
    const { text } = await generateText({
      model: anthropic('claude-opus-4-6'),
      system: `You are an expert executive coach specializing in difficult workplace conversations.
Your role is to review a manager's talking points and provide constructive feedback to improve clarity, tone, and effectiveness.

Focus on:
- Identifying vague, judgmental, or aggressive language
- Suggesting more precise alternatives
- Checking for completeness (specific behaviors, not just outcomes)
- Calibrating tone (direct but compassionate)
- Flagging potential legal concerns (discriminatory or retaliatory language)

Provide your feedback in a supportive, actionable format.`,
      messages: [
        {
          role: 'user',
          content: `Please review these talking points for a ${conversationType} conversation:

**Context:** ${context}

**Behavior:** ${behavior}

**Impact:** ${impact}

**Desired Outcome:** ${outcome}

**Talking Points:**
${talkingPoints}

Provide specific, actionable feedback to improve these talking points.`,
        },
      ],
    });

    return Response.json({ text });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('invalid_api_key') || error.message.includes('401'))) {
      return Response.json({ error: 'Invalid API key. Please check your Anthropic API key in Settings.' }, { status: 401 });
    }
    return Response.json({ error: 'Failed to get AI feedback. Please try again.' }, { status: 500 });
  }
}
