'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  generateId,
  saveConversation,
  Conversation,
  ConversationType,
  CONVERSATION_TYPES,
  ChecklistItem,
  hasApiKey,
} from '../lib/db';
import { reviewTalkingPoints, generateOpeners } from '../lib/ai';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

const STEPS = [
  'Choose Type',
  'Context',
  'Behavior & Impact',
  'Desired Outcome',
  'Anticipate Objections',
  'Talking Points',
  'Pre-flight Checklist',
];

export default function NewConversation() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  const [type, setType] = useState<ConversationType>('performance');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [behavior, setBehavior] = useState('');
  const [impact, setImpact] = useState('');
  const [outcome, setOutcome] = useState('');
  const [objections, setObjections] = useState<string[]>(['']);
  const [talkingPoints, setTalkingPoints] = useState('');
  const [coachingFeedback, setCoachingFeedback] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [suggestedOpeners, setSuggestedOpeners] = useState<string[]>([]);

  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    hasApiKey().then(setApiKeyConfigured);
  }, []);

  async function handleNext() {
    if (step === 5 && talkingPoints.trim() && apiKeyConfigured) {
      setLoading(true);
      try {
        const feedback = await reviewTalkingPoints(type, context, behavior, impact, outcome, talkingPoints);
        setCoachingFeedback(feedback);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to get AI feedback.');
      } finally {
        setLoading(false);
      }
    }

    if (step === 6) {
      generateChecklist();
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  async function handleGetOpeners() {
    if (!context.trim() || !behavior.trim()) {
      alert('Please fill in context and behavior first');
      return;
    }
    setLoading(true);
    try {
      const openers = await generateOpeners(type, context, behavior);
      setSuggestedOpeners(openers);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate opening lines.');
    } finally {
      setLoading(false);
    }
  }

  function generateChecklist() {
    const items: ChecklistItem[] = [];
    if (type === 'termination') {
      items.push(
        { id: generateId(), text: 'HR has been consulted and approves', checked: false },
        { id: generateId(), text: 'Final paycheck and benefits info prepared', checked: false },
        { id: generateId(), text: 'Return of company property arranged', checked: false },
        { id: generateId(), text: 'Exit meeting logistics confirmed', checked: false }
      );
    } else if (type === 'pip') {
      items.push(
        { id: generateId(), text: 'PIP document drafted and reviewed by HR', checked: false },
        { id: generateId(), text: 'Specific, measurable goals documented', checked: false },
        { id: generateId(), text: 'Timeline and checkpoints established', checked: false },
        { id: generateId(), text: 'Support resources identified', checked: false }
      );
    } else {
      items.push(
        { id: generateId(), text: 'Previous feedback documented', checked: false },
        { id: generateId(), text: 'Specific examples prepared', checked: false },
        { id: generateId(), text: 'Time and place conducive to privacy', checked: false },
        { id: generateId(), text: 'Follow-up plan ready', checked: false }
      );
    }
    setChecklist(items);
  }

  async function handleFinish() {
    const conversation: Conversation = {
      id: generateId(),
      title: title || `${CONVERSATION_TYPES.find((t) => t.value === type)?.label} - ${new Date().toLocaleDateString()}`,
      type,
      status: 'preparing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context,
      behavior,
      impact,
      outcome,
      objections: objections.filter((o) => o.trim()),
      talkingPoints,
      coachingFeedback,
      checklist,
    };
    await saveConversation(conversation);
    router.push(`/review/${conversation.id}`);
  }

  function canProceed() {
    switch (step) {
      case 0: return true;
      case 1: return context.trim().length > 0;
      case 2: return behavior.trim().length > 0 && impact.trim().length > 0;
      case 3: return outcome.trim().length > 0;
      case 4: return objections.some((o) => o.trim());
      case 5: return talkingPoints.trim().length > 0;
      case 6: return true;
      default: return false;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-3xl font-semibold text-stone-900">
            New Conversation Prep
          </h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <p className="text-base text-stone-700 font-medium mb-4">{STEPS[step]}</p>
        <Progress value={progress} />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 mb-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Conversation Title (optional)</Label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Performance discussion with team member"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <Label>Conversation Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {CONVERSATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value as ConversationType)}
                    className={`p-4 text-left border-2 rounded-xl text-sm transition-all ${
                      type === t.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-stone-200 hover:border-blue-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className={`font-medium ${type === t.value ? 'text-blue-900' : 'text-stone-900'}`}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="context">Describe the situation</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-2">
                What happened, when did it happen, is this a pattern or one-off?
              </p>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe the context and background..."
                rows={8}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="behavior">Specific Behavior</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-2">
                What specific behavior needs to change? Be concrete.
              </p>
              <Textarea
                id="behavior"
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Describe the specific behavior..."
                rows={5}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="impact">Impact</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-2">
                What impact has this had on the team or business?
              </p>
              <Textarea
                id="impact"
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="Describe the impact..."
                rows={5}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="outcome">Desired Outcome</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-2">
                What does success look like after this conversation?
              </p>
              <Textarea
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g., Mutual understanding, agreed action plan, formal warning acknowledged..."
                rows={6}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Anticipated Objections or Reactions</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-2">
                What pushback, deflection, or emotional reactions do you expect?
              </p>
              {objections.map((objection, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={objection}
                    onChange={(e) => {
                      const updated = [...objections];
                      updated[idx] = e.target.value;
                      setObjections(updated);
                    }}
                    placeholder={`Reaction ${idx + 1}...`}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {idx === objections.length - 1 && (
                    <Button size="sm" variant="outline" onClick={() => setObjections([...objections, ''])}>
                      +
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {!apiKeyConfigured && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    <strong>Optional:</strong> Configure your Anthropic API key in{' '}
                    <Link href="/settings" className="underline font-semibold">Settings</Link>{' '}
                    to enable AI-powered features like opening line suggestions and talking points review.
                  </p>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="talkingPoints">Your Talking Points</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGetOpeners}
                  disabled={loading || !apiKeyConfigured}
                  className="border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Suggest Openers
                </Button>
              </div>
              <p className="text-xs text-stone-500 mt-1 mb-2">
                Draft your key messages. {apiKeyConfigured ? 'The AI will review these for clarity and tone.' : 'Configure API key to enable AI review.'}
              </p>
              <Textarea
                id="talkingPoints"
                value={talkingPoints}
                onChange={(e) => setTalkingPoints(e.target.value)}
                placeholder="Write your talking points..."
                rows={10}
                className="text-sm"
              />
            </div>

            {suggestedOpeners.length > 0 && (
              <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-violet-900">AI Suggested Opening Lines</h4>
                </div>
                <ol className="space-y-2.5 text-sm text-violet-900">
                  {suggestedOpeners.map((opener, idx) => (
                    <li key={idx} className="pl-2 leading-relaxed">
                      <span className="font-medium">{idx + 1}.</span> {opener}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {coachingFeedback && (
              <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-violet-900">AI Coaching Feedback</h4>
                </div>
                <div className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">
                  {coachingFeedback}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div>
              <Label>Pre-flight Checklist</Label>
              <p className="text-xs text-neutral-500 mt-1 mb-3">Have you covered these essentials?</p>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        setChecklist(checklist.map((i) =>
                          i.id === item.id ? { ...i, checked: e.target.checked } : i
                        ));
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300"
                    />
                    <span className="text-sm text-neutral-700">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed() || loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleFinish}>Finish & Save</Button>
        )}
      </div>
    </div>
  );
}
