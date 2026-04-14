'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, AlertCircle, Sparkles, Settings } from 'lucide-react';
import {
  getConversation, saveConversation, Conversation, PracticeMessage, hasApiKey,
} from '../../lib/db';
import { streamPracticeSession, generatePracticeDebrief } from '../../lib/ai';
import { Button } from '../../components/ui/button';

export default function Practice() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showDebrief, setShowDebrief] = useState(false);
  const [debrief, setDebrief] = useState('');
  const [generatingDebrief, setGeneratingDebrief] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadConversation();
    hasApiKey().then((configured) => {
      setApiKeyConfigured(configured);
      setCheckingApiKey(false);
    });
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  async function loadConversation() {
    const convo = await getConversation(id);
    if (convo) {
      setConversation(convo);
      if (convo.practiceTranscript?.length) setMessages(convo.practiceTranscript);
      if (convo.practiceDebrief) setDebrief(convo.practiceDebrief);
    }
  }

  async function handleSend() {
    if (!input.trim() || !conversation || isStreaming) return;

    const isCoachRequest = input.trim() === '/coach';
    const userMessage: PracticeMessage = {
      role: 'manager',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setCurrentResponse('');

    try {
      const conversationHistory = newMessages.map((msg) => ({
        role: msg.role === 'manager' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));

      let fullResponse = '';
      for await (const chunk of streamPracticeSession(
        conversation.type,
        conversation.context || '',
        conversation.behavior || '',
        conversation.objections || [],
        conversation.talkingPoints || '',
        conversationHistory
      )) {
        fullResponse += chunk;
        setCurrentResponse(fullResponse);
      }

      const assistantMessage: PracticeMessage = {
        role: isCoachRequest ? 'coach' : 'employee',
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      setCurrentResponse('');
      await saveConversation({ ...conversation, practiceTranscript: updatedMessages });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to get response. Please check your API key in Settings.');
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleEndSession() {
    if (!conversation || messages.length === 0) {
      router.push(`/conversation/${id}`);
      return;
    }
    setGeneratingDebrief(true);
    try {
      const debriefText = await generatePracticeDebrief(conversation.type, messages);
      setDebrief(debriefText);
      await saveConversation({ ...conversation, practiceDebrief: debriefText, practiceTranscript: messages });
      setShowDebrief(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate debrief. Please check your API key.');
    } finally {
      setGeneratingDebrief(false);
    }
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (showDebrief) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/conversation/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Conversation
          </Button>
        </div>
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 border-2 border-violet-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">Practice Session Debrief</h2>
          </div>
          <div className="bg-white rounded-xl border-2 border-violet-200 p-6">
            <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">{debrief}</div>
          </div>
          <div className="mt-6 pt-6 border-t-2 border-violet-200">
            <Button onClick={() => router.push(`/conversation/${id}`)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              Return to Conversation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="border-b border-neutral-200 bg-white px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/conversation/${id}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Practice
            </Button>
            <div>
              <h2 className="font-semibold text-neutral-900">Practice Session</h2>
              <p className="text-xs text-neutral-500">Type /coach anytime for real-time guidance</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndSession}
            disabled={generatingDebrief}
          >
            {generatingDebrief ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ending...</>
            ) : 'End Session'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {!apiKeyConfigured && !checkingApiKey && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-5 mb-6 flex gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-900 mb-1">API Key Required</h3>
                <p className="text-sm text-red-800 mb-3 leading-relaxed">
                  Practice sessions require an Anthropic API key. Configure your key to use AI role-play features.
                </p>
                <Link href="/settings">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!conversation.comprehensiveFeedback && messages.length === 0 && apiKeyConfigured && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 mb-6 flex gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-900 mb-1">Pre-flight Review Not Completed</h3>
                <p className="text-sm text-amber-800 mb-3 leading-relaxed">
                  We recommend getting comprehensive AI feedback on your preparation before practicing.
                </p>
                <Link href={`/review/${id}`}>
                  <Button size="sm" variant="outline" className="border-violet-300 text-violet-700 hover:bg-violet-50">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Pre-flight Review
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {messages.length === 0 && apiKeyConfigured && !checkingApiKey && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 mb-6 shadow-sm">
                <Send className="w-10 h-10 text-blue-600" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">Start the conversation</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Begin by opening the conversation. The AI will respond as the employee would. Type{' '}
                <code className="px-2 py-1 bg-violet-100 text-violet-700 rounded-md text-xs font-medium">/coach</code>{' '}
                anytime for guidance.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'manager' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${
                  msg.role === 'manager'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                    : msg.role === 'coach'
                      ? 'bg-gradient-to-br from-violet-100 to-purple-100 text-violet-900 border-2 border-violet-300'
                      : 'bg-white text-stone-900 border-2 border-stone-200'
                }`}>
                  <div className="text-xs font-semibold mb-1.5 opacity-75 uppercase tracking-wide">
                    {msg.role === 'manager' ? 'You (Manager)' : msg.role === 'coach' ? '✨ AI Coach' : 'Employee'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}

            {currentResponse && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-white text-stone-900 border-2 border-stone-200 shadow-sm">
                  <div className="text-xs font-semibold mb-1.5 opacity-75 uppercase tracking-wide">Employee</div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{currentResponse}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t-2 border-stone-200 bg-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {!apiKeyConfigured && !checkingApiKey ? (
            <div className="text-center py-3">
              <p className="text-sm text-red-700 mb-3">Configure your API key to start practicing</p>
              <Link href="/settings">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={checkingApiKey ? 'Checking configuration...' : 'Type your message or /coach for guidance...'}
                disabled={isStreaming || checkingApiKey || !apiKeyConfigured}
                className="flex-1 px-4 py-3 border-2 border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-stone-100 shadow-sm"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isStreaming || checkingApiKey || !apiKeyConfigured}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50"
              >
                {isStreaming || checkingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
