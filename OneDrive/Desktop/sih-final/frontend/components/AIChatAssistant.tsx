"use client";

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { assistantAPI, ChatMessage, ChatReply } from '@/lib/api';
import { Send, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ChatItem extends ChatMessage { id: string; pending?: boolean }

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatItem[]>([{
    id: 'welcome', role: 'assistant', content: 'Hello — I can help analyze consultation feedback, summarize themes, and suggest actions. Ask a question like: “What are the top concerns from negative feedback?”'
  }]);
  const [input, setInput] = useState('');
  const [sentimentFocus, setSentimentFocus] = useState<string>('all');
  const listRef = useRef<HTMLDivElement | null>(null);

  const chatMutation = useMutation<ChatReply, Error, { prompt: string }>({
    mutationFn: async ({ prompt }) => {
      const chain: ChatMessage[] = messages
        .filter(m => !m.pending)
        .map(m => ({ role: m.role, content: m.content }))
        .concat({ role: 'user', content: prompt });
      return assistantAPI.chat(chain, { sentimentFocus: sentimentFocus === 'all' ? undefined : sentimentFocus });
    },
    onSuccess: (data, vars) => {
      setMessages(prev => prev
        .filter(m => !m.pending)
        .concat({ id: crypto.randomUUID(), role: 'user', content: vars.prompt }, {
          id: crypto.randomUUID(), role: 'assistant', content: data.reply
        }));
    },
    onError: () => {
      setMessages(prev => prev.filter(m => !m.pending).concat({
        id: crypto.randomUUID(), role: 'assistant', content: 'Error: unable to generate reply.'
      }));
    }
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;
    setMessages(prev => prev.concat({ id: crypto.randomUUID(), role: 'user', content: trimmed, pending: true }));
    setInput('');
    chatMutation.mutate({ prompt: trimmed });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Card className="border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Bot className="h-5 w-5" /> Consultation AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className="text-gray-600">Filter context:</span>
          {['all','Positive','Neutral','Negative'].map(s => (
            <button
              key={s}
              onClick={() => setSentimentFocus(s)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${sentimentFocus===s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}
            >{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
        <div ref={listRef} className="h-80 overflow-y-auto rounded border bg-white p-3 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex items-start gap-3 ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <div className="shrink-0 p-2 rounded bg-indigo-50 text-indigo-600"><Bot className="h-4 w-4" /></div>}
              <div className={`max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap rounded-lg px-3 py-2 shadow-sm ${m.role==='assistant' ? 'bg-indigo-50 text-gray-800' : 'bg-indigo-600 text-white'} ${m.pending ? 'opacity-60' : ''}`}>
                {m.content}
                {m.pending && <span className="inline-block ml-2 animate-pulse">…</span>}
              </div>
              {m.role === 'user' && <div className="shrink-0 p-2 rounded bg-indigo-600 text-white"><User className="h-4 w-4" /></div>}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Generating response…</div>
          )}
        </div>
        {chatMutation.isError && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-xs"><AlertCircle className="h-4 w-4" /> Request failed. Try again.</div>
        )}
        <div className="mt-4 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about trends, key concerns, recommendations..."
            className="min-h-[70px]"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-500">Shift+Enter for newline • Context: {sentimentFocus === 'all' ? 'All sentiments' : sentimentFocus}</span>
            <Button onClick={send} disabled={chatMutation.isPending || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
