'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSetting, saveSetting, getDB } from '../lib/db';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function Settings() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    getSetting('apiKey').then((key) => {
      if (key && typeof key === 'string') setApiKey(key);
    });
  }, []);

  async function handleSave() {
    await saveSetting('apiKey', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteAllData() {
    const db = await getDB();
    await db.clear('conversations');
    await db.clear('settings');
    setShowDeleteDialog(false);
    setApiKey('');
    alert('All data deleted successfully');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="bg-white border-2 border-stone-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Anthropic API Key</h2>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 mb-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Privacy Notice</p>
              <p className="leading-relaxed mb-3">
                Your API key is stored locally on your device only. It's never sent to our servers. When you use AI features, your notes are sent directly to Anthropic's Claude API.
              </p>
              <p className="leading-relaxed">
                <strong>Do not include employee full names or sensitive PII</strong> in your prep notes.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative mt-2">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 pr-12 border-2 border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4 text-neutral-500" /> : <Eye className="w-4 h-4 text-neutral-500" />}
                </button>
              </div>
              <div className="text-xs text-stone-600 mt-3 space-y-1">
                <p><strong>How to get an API key:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Visit{' '}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      console.anthropic.com/settings/keys
                    </a>
                  </li>
                  <li>Create a new API key (free tier available)</li>
                  <li>Copy and paste it above</li>
                </ol>
                <p className="mt-2 text-amber-700">
                  <strong>Note:</strong> Standard API usage rates apply when using AI features.
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={!apiKey.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              {saved ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</>
              ) : 'Save API Key'}
            </Button>
          </div>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Data Management</h2>
          <p className="text-sm text-stone-600 mb-4 leading-relaxed">
            All your conversations and settings are stored locally in your browser. Clearing your browser data will delete everything.
          </p>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="border-red-300 text-red-700 hover:bg-red-50">
            Delete All Data
          </Button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-violet-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">About</h2>
          <div className="text-sm text-stone-700 space-y-3 leading-relaxed">
            <p>
              <strong className="text-stone-900">Difficult Chat Mentor</strong> is a private AI coach for managers preparing for difficult conversations.
            </p>
            <p>Version 1.0 • Built with Claude Opus 4.6</p>
            <p>All data stays on your device. No account required.</p>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all conversations, prep notes, practice sessions, and your API key. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllData}>Delete Everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
