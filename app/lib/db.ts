import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;

  // Wizard data
  context?: string;
  behavior?: string;
  impact?: string;
  outcome?: string;
  objections?: string[];
  talkingPoints?: string;
  checklist?: ChecklistItem[];

  // AI coaching
  coachingFeedback?: string;
  comprehensiveFeedback?: {
    context: string;
    behavior: string;
    impact: string;
    outcome: string;
    objections: string;
    talkingPoints: string;
    overall: string;
  };

  // Practice session
  practiceTranscript?: PracticeMessage[];
  practiceDebrief?: string;

  // Post-conversation
  reflection?: string;
}

export type ConversationType =
  | 'performance'
  | 'feedback'
  | 'pip'
  | 'termination'
  | 'compensation'
  | 'role-change'
  | 'conflict'
  | 'sensitive';

export type ConversationStatus = 'preparing' | 'ready' | 'happened' | 'archived';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface PracticeMessage {
  role: 'manager' | 'employee' | 'coach';
  content: string;
  timestamp: string;
}

interface DifficultChatDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-status': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: string | boolean | number;
  };
}

let dbInstance: IDBPDatabase<DifficultChatDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DifficultChatDB>('difficult-chat-mentor', 1, {
    upgrade(db) {
      const conversationStore = db.createObjectStore('conversations', {
        keyPath: 'id',
      });
      conversationStore.createIndex('by-status', 'status');
      conversationStore.createIndex('by-date', 'updatedAt');

      db.createObjectStore('settings');
    },
  });

  return dbInstance;
}

export async function saveConversation(conversation: Conversation) {
  const db = await getDB();
  conversation.updatedAt = new Date().toISOString();
  await db.put('conversations', conversation);
  return conversation;
}

export async function getConversation(id: string) {
  const db = await getDB();
  return await db.get('conversations', id);
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDB();
  const conversations = await db.getAllFromIndex('conversations', 'by-date');
  return conversations.reverse();
}

export async function deleteConversation(id: string) {
  const db = await getDB();
  await db.delete('conversations', id);
}

export async function getSetting(key: string) {
  const db = await getDB();
  return await db.get('settings', key);
}

export async function saveSetting(key: string, value: string | boolean | number) {
  const db = await getDB();
  await db.put('settings', value, key);
}

export async function hasApiKey(): Promise<boolean> {
  const apiKey = await getSetting('apiKey');
  return !!(apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const CONVERSATION_TYPES = [
  { value: 'performance', label: 'Performance Concerns' },
  { value: 'feedback', label: 'Critical / Corrective Feedback' },
  { value: 'pip', label: 'Performance Improvement Plan (PIP)' },
  { value: 'termination', label: 'Termination' },
  { value: 'compensation', label: 'Compensation Denial' },
  { value: 'role-change', label: 'Role or Scope Change' },
  { value: 'conflict', label: 'Conflict Between Reports' },
  { value: 'sensitive', label: 'Sensitive Personal Matters' },
] as const;
