'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Settings, Search, MessageSquare } from 'lucide-react';
import {
  getAllConversations,
  Conversation,
  CONVERSATION_TYPES,
  deleteConversation,
} from './lib/db';
import { Button } from './components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const convos = await getAllConversations();
    setConversations(convos);
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setDeleteId(null);
    loadConversations();
  }

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusGroups = {
    preparing: filteredConversations.filter((c) => c.status === 'preparing'),
    ready: filteredConversations.filter((c) => c.status === 'ready'),
    happened: filteredConversations.filter((c) => c.status === 'happened'),
    archived: filteredConversations.filter((c) => c.status === 'archived'),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-stone-900 mb-2">
            Your Conversations
          </h2>
          <p className="text-sm text-stone-600">
            Prepare for difficult conversations with confidence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="border-stone-300">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </Link>
        </div>
      </div>

      {conversations.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
            />
          </div>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 mb-6 shadow-sm">
            <MessageSquare className="w-10 h-10 text-blue-600" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-stone-900 mb-2">
            No conversations yet
          </h3>
          <p className="text-sm text-stone-600 mb-8 max-w-md mx-auto leading-relaxed">
            Start by creating your first conversation preparation. We'll guide you through
            structured preparation, AI coaching, and practice sessions.
          </p>
          <Link href="/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Conversation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(statusGroups).map(
            ([status, items]) =>
              items.length > 0 && (
                <div key={status}>
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      status === 'preparing' ? 'bg-blue-500' :
                      status === 'ready' ? 'bg-green-500' :
                      status === 'happened' ? 'bg-stone-400' :
                      'bg-stone-300'
                    }`} />
                    {status === 'preparing' && 'In Progress'}
                    {status === 'ready' && 'Ready to Go'}
                    {status === 'happened' && 'Completed'}
                    {status === 'archived' && 'Archived'}
                  </h3>
                  <div className="space-y-3">
                    {items.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        onDelete={() => setDeleteId(conversation.id)}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all associated notes. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConversationCard({
  conversation,
  onDelete,
}: {
  conversation: Conversation;
  onDelete: () => void;
}) {
  const typeLabel =
    CONVERSATION_TYPES.find((t) => t.value === conversation.type)?.label || conversation.type;

  const statusConfig = {
    preparing: {
      badge: 'bg-blue-50 text-blue-700 border border-blue-200',
      border: 'border-t-blue-500',
    },
    ready: {
      badge: 'bg-green-50 text-green-700 border border-green-200',
      border: 'border-t-green-500',
    },
    happened: {
      badge: 'bg-stone-100 text-stone-700 border border-stone-200',
      border: 'border-t-stone-400',
    },
    archived: {
      badge: 'bg-stone-50 text-stone-500 border border-stone-200',
      border: 'border-t-stone-300',
    },
  };

  const config = statusConfig[conversation.status];

  return (
    <Link href={`/conversation/${conversation.id}`}>
      <div className={`group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 hover:shadow-md transition-all ${config.border} border-t-4`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-stone-900 truncate group-hover:text-blue-600 transition-colors">
                {conversation.title}
              </h4>
              <p className="text-sm text-stone-500 mt-1">{typeLabel}</p>
            </div>
            <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${config.badge}`}>
              {conversation.status}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              Updated {new Date(conversation.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
