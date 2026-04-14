'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit3, Play, CheckCircle2, Archive, Trash2, Loader2, Sparkles,
} from 'lucide-react';
import {
  getConversation, saveConversation, deleteConversation, Conversation, CONVERSATION_TYPES,
} from '../../lib/db';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [reflection, setReflection] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadConversation();
  }, [id]);

  async function loadConversation() {
    const convo = await getConversation(id);
    if (convo) {
      setConversation(convo);
      setReflection(convo.reflection || '');
    }
  }

  async function handleStatusChange(status: Conversation['status']) {
    if (!conversation) return;
    const updated = { ...conversation, status };
    await saveConversation(updated);
    setConversation(updated);
  }

  async function handleSaveReflection() {
    if (!conversation) return;
    const updated = { ...conversation, reflection };
    await saveConversation(updated);
    setConversation(updated);
    setEditMode(false);
  }

  async function handleDelete() {
    await deleteConversation(id);
    router.push('/');
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-1">{conversation.title}</h1>
            <p className="text-sm text-neutral-600">{typeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {conversation.status === 'preparing' && (
              <Button size="sm" onClick={() => handleStatusChange('ready')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
            )}
            {conversation.status === 'ready' && (
              <Button size="sm" onClick={() => handleStatusChange('happened')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(conversation.status === 'archived' ? 'preparing' : 'archived')}
            >
              <Archive className="w-4 h-4 mr-2" />
              {conversation.status === 'archived' ? 'Unarchive' : 'Archive'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {!conversation.comprehensiveFeedback && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-violet-900 mb-1">Pre-flight Review Recommended</h3>
                <p className="text-sm text-violet-800 mb-4 leading-relaxed">
                  Get comprehensive AI feedback on your preparation before practicing. This will help you refine your approach and identify any gaps.
                </p>
                <Link href={`/review/${conversation.id}`}>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Pre-flight Review
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {conversation.comprehensiveFeedback && (
              <Link href={`/review/${conversation.id}`}>
                <Button variant="outline" size="sm" className="border-violet-300 text-violet-700 hover:bg-violet-50">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View AI Review
                </Button>
              </Link>
            )}
            <Link href={`/practice/${conversation.id}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <Play className="w-4 h-4 mr-2" />
                {conversation.practiceTranscript ? 'Resume Practice' : 'Start Practice'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="Context">
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{conversation.context || 'No context provided'}</p>
        </Section>

        <Section title="Behavior & Impact">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-neutral-500">Behavior</Label>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap mt-1">{conversation.behavior || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Impact</Label>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap mt-1">{conversation.impact || 'Not specified'}</p>
            </div>
          </div>
        </Section>

        <Section title="Desired Outcome">
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{conversation.outcome || 'No outcome specified'}</p>
        </Section>

        {conversation.objections && conversation.objections.length > 0 && (
          <Section title="Anticipated Objections">
            <ul className="space-y-2">
              {conversation.objections.map((obj, idx) => (
                <li key={idx} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="text-neutral-400 mt-0.5">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Talking Points">
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{conversation.talkingPoints || 'No talking points'}</p>
        </Section>

        {conversation.comprehensiveFeedback && (
          <Section title="Pre-flight AI Review">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-violet-900">Overall Assessment</h4>
                </div>
                <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">
                  {conversation.comprehensiveFeedback.overall}
                </p>
              </div>
              <div className="flex justify-end">
                <Link href={`/review/${conversation.id}`}>
                  <Button variant="outline" size="sm" className="border-violet-300 text-violet-700 hover:bg-violet-50">
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Full Review
                  </Button>
                </Link>
              </div>
            </div>
          </Section>
        )}

        {conversation.coachingFeedback && (
          <Section title="Talking Points Feedback">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-violet-900">AI Feedback</h4>
              </div>
              <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{conversation.coachingFeedback}</p>
            </div>
          </Section>
        )}

        {conversation.checklist && conversation.checklist.length > 0 && (
          <Section title="Pre-flight Checklist">
            <div className="space-y-2">
              {conversation.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={async (e) => {
                      const updatedChecklist = conversation.checklist?.map((i) =>
                        i.id === item.id ? { ...i, checked: e.target.checked } : i
                      );
                      const updated = { ...conversation, checklist: updatedChecklist };
                      await saveConversation(updated);
                      setConversation(updated);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">{item.text}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {conversation.practiceDebrief && (
          <Section title="Practice Session Debrief">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{conversation.practiceDebrief}</p>
            </div>
          </Section>
        )}

        <Section title="Post-Conversation Reflection">
          {editMode ? (
            <div className="space-y-3">
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did the conversation go? What went well? What would you do differently?"
                rows={6}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveReflection}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setReflection(conversation.reflection || ''); setEditMode(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {conversation.reflection ? (
                <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-3">{conversation.reflection}</p>
              ) : (
                <p className="text-sm text-neutral-500 mb-3">No reflection yet</p>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                {conversation.reflection ? 'Edit' : 'Add'} Reflection
              </Button>
            </div>
          )}
        </Section>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all preparation notes, practice sessions, and reflections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-stone-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-500 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}
