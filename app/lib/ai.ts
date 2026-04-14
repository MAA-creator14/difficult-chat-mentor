import { getSetting } from './db';

async function getApiKey(): Promise<string> {
  const apiKey = await getSetting('apiKey');
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key not configured. Please go to Settings and add your Anthropic API key to use AI features.');
  }
  return apiKey;
}

function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes('Invalid API key')) {
      throw new Error('Invalid API key. Please check your Anthropic API key in Settings.');
    }
    throw error;
  }
  throw new Error('An unexpected error occurred. Please try again.');
}

export async function reviewTalkingPoints(
  conversationType: string,
  context: string,
  behavior: string,
  impact: string,
  outcome: string,
  talkingPoints: string
): Promise<string> {
  const apiKey = await getApiKey();
  const response = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ conversationType, context, behavior, impact, outcome, talkingPoints }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to get AI feedback.');
  return data.text;
}

export async function generateOpeners(
  conversationType: string,
  context: string,
  behavior: string
): Promise<string[]> {
  const apiKey = await getApiKey();
  const response = await fetch('/api/ai/openers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ conversationType, context, behavior }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate opening lines.');
  return data.lines;
}

export async function* streamPracticeSession(
  conversationType: string,
  context: string,
  behavior: string,
  objections: string[],
  talkingPoints: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncGenerator<string> {
  let apiKey: string;
  try {
    apiKey = await getApiKey();
  } catch (error) {
    handleApiError(error);
  }

  const response = await fetch('/api/ai/practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey! },
    body: JSON.stringify({ conversationType, context, behavior, objections, talkingPoints, conversationHistory }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to start practice session.');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

export async function generatePracticeDebrief(
  conversationType: string,
  transcript: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = await getApiKey();
  const response = await fetch('/api/ai/debrief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ conversationType, transcript }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate debrief.');
  return data.text;
}

export interface ComprehensiveFeedback {
  context: string;
  behavior: string;
  impact: string;
  outcome: string;
  objections: string;
  talkingPoints: string;
  overall: string;
}

export async function generateComprehensiveFeedback(
  conversationType: string,
  context: string,
  behavior: string,
  impact: string,
  outcome: string,
  objections: string[],
  talkingPoints: string
): Promise<ComprehensiveFeedback> {
  const apiKey = await getApiKey();
  const response = await fetch('/api/ai/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ conversationType, context, behavior, impact, outcome, objections, talkingPoints }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate feedback.');
  return data as ComprehensiveFeedback;
}
