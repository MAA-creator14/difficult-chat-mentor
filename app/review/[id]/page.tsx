'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import {
  getConversation, saveConversation, Conversation, CONVERSATION_TYPES, hasApiKey,
} from '../../lib/db';
import { generateComprehensiveFeedback, ComprehensiveFeedback } from '../../lib/ai';
import { Button } from '../../components/ui/button';

export default function PreFlightReview() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<ComprehensiveFeedback | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  useEffect(() => {
    if (id) loadConversation();
    hasApiKey().then((configured) => {
      setApiKeyConfigured(configured);
      setCheckingApiKey(false);
    });
  }, [id]);

  async function loadConversation() {
    const convo = await getConversation(id);
    if (convo) {
      setConversation(convo);
      if (convo.comprehensiveFeedback) setFeedback(convo.comprehensiveFeedback);
    }
  }

  async function handleGetFeedback() {
    if (!conversation) return;
    setLoading(true);
    try {
      const comprehensiveFeedback = await generateComprehensiveFeedback(
        conversation.type,
        conversation.context || '',
        conversation.behavior || '',
        conversation.impact || '',
        conversation.outcome || '',
        conversation.objections || [],
        conversation.talkingPoints || ''
      );
      setFeedback(comprehensiveFeedback);
      const updated = { ...conversation, comprehensiveFeedback, status: 'ready' as const };
      await saveConversation(updated);
      setConversation(updated);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to get feedback. Please check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    if (!conversation) return;
    if (conversation.status === 'preparing') {
      await saveConversation({ ...conversation, status: 'ready' });
    }
    router.push(`/conversation/${id}`);
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const typeLabel = CONVERSATION_TYPES.find((t) => t.value === conversation.type)?.label || conversation.type;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/conversation/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Conversation
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Pre-flight Review</h1>
        <p className="text-sm text-neutral-600">Review your preparation for: {conversation.title}</p>
        <p className="text-xs text-neutral-500 mt-1">{typeLabel}</p>
      </div>

      {!feedback ? (
        <div>
          {!apiKeyConfigured && !checkingApiKey && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 mb-6 flex gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-900 mb-1">API Key Required</h3>
                <p className="text-sm text-amber-800 mb-3 leading-relaxed">
                  You need to configure your Anthropic API key to use AI features. Your key is stored locally and only used to call the Claude API.
                </p>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Key in Settings
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 border-2 border-violet-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">Ready for AI Review</h2>
            <p className="text-base text-stone-700 mb-8 max-w-lg mx-auto leading-relaxed">
              Get comprehensive feedback on your preparation before practicing. The AI will review your context, talking points, tone, clarity, and completeness.
            </p>
            <Button
              onClick={handleGetFeedback}
              disabled={loading || !apiKeyConfigured || checkingApiKey}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing your preparation...</>
              ) : checkingApiKey ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Checking configuration...</>
              ) : !apiKeyConfigured ? (
                <><Settings className="w-5 h-5 mr-2" />Configure API Key First</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" />Get AI Feedback</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 flex gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-green-900 mb-1">Review Complete</h3>
              <p className="text-sm text-green-800 leading-relaxed">
                Your preparation has been reviewed. Read through the feedback below and make any adjustments before practicing.
              </p>
            </div>
          </div>

          <ReviewSection title="Overall Assessment" input="" feedback={feedback.overall} variant="primary" />
          <ReviewSection title="Context" input={conversation.context || ''} feedback={feedback.context} />
          <ReviewSection title="Behavior" input={conversation.behavior || ''} feedback={feedback.behavior} />
          <ReviewSection title="Impact" input={conversation.impact || ''} feedback={feedback.impact} />
          <ReviewSection title="Desired Outcome" input={conversation.outcome || ''} feedback={feedback.outcome} />
          <ReviewSection
            title="Anticipated Objections"
            input={conversation.objections?.map((o, i) => `${i + 1}. ${o}`).join('\n') || ''}
            feedback={feedback.objections}
          />
          <ReviewSection title="Talking Points" input={conversation.talkingPoints || ''} feedback={feedback.talkingPoints} />

          <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
            <Button variant="outline" onClick={() => router.push(`/conversation/${id}`)}>
              Edit Preparation
            </Button>
            <Button onClick={handleContinue} size="lg">
              Continue to Conversation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewSection({
  title, input, feedback, variant = 'default',
}: {
  title: string;
  input: string;
  feedback: string;
  variant?: 'default' | 'primary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <div className={`rounded-xl border-2 p-6 shadow-sm ${isPrimary ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300' : 'bg-white border-stone-200'}`}>
      <h3 className="text-base font-semibold text-stone-900 mb-4">{title}</h3>
      {input && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-stone-400 inline-block" />
            Your Input
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
            <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{input}</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-semibold text-violet-900 uppercase tracking-wider">AI Feedback</p>
        </div>
        <div className={`rounded-xl p-4 ${isPrimary ? 'bg-white border-2 border-violet-200' : 'bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200'}`}>
          <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{feedback}</p>
        </div>
      </div>
    </div>
  );
}
