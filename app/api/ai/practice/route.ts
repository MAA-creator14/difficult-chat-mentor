import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationType, context, behavior, objections, talkingPoints, conversationHistory } = body;

  const anthropic = createAnthropic({ apiKey });

  const systemPrompt = `You are simulating an employee in a ${conversationType} conversation with their manager.

**Your Persona:**
Based on the context and anticipated objections, respond realistically with:
- Potential defensiveness, denial, or emotional reactions
- Questions and pushback
- Moments of genuine reflection or agreement
- Varying emotional states throughout the conversation

**Context:**
${context}

**Behavior being addressed:**
${behavior}

**Anticipated reactions:**
${(objections as string[]).join(', ')}

**Manager's talking points:**
${talkingPoints}

Stay in character as the employee. React authentically to what the manager says. Vary your responses - don't always be defensive, but don't immediately agree either. Make this feel like a real conversation.

If the manager types "/coach", break character and provide coaching advice, then resume the employee role.`;

  const result = streamText({
    model: anthropic('claude-opus-4-6'),
    system: systemPrompt,
    messages: conversationHistory,
  });

  return result.toTextStreamResponse();
}
