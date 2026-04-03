'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, Plus, Trash2, Loader2 } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;

const methodColors: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PATCH: 'text-amber-400',
  DELETE: 'text-rose-400',
};

interface HeaderEntry {
  key: string;
  value: string;
}

export default function DeveloperPlaygroundPage() {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState('/api/v1/');
  const [headers, setHeaders] = useState<HeaderEntry[]>([
    { key: 'Authorization', value: 'Bearer <your-api-key>' },
    { key: 'Content-Type', value: 'application/json' },
  ]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; time: number; body: string } | null>(null);

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const updated = [...headers];
    updated[i] = { ...updated[i], [field]: val };
    setHeaders(updated);
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const hdrs: Record<string, string> = {};
      headers.forEach((h) => { if (h.key) hdrs[h.key] = h.value; });

      const opts: RequestInit = { method, headers: hdrs };
      if (method !== 'GET' && body) {
        opts.body = body;
      }

      const res = await fetch(url, opts);
      const elapsed = Math.round(performance.now() - start);
      let resBody: string;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        resBody = JSON.stringify(json, null, 2);
      } else {
        resBody = await res.text();
      }

      setResponse({ status: res.status, time: elapsed, body: resBody });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponse({ status: 0, time: elapsed, body: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const statusColorClass = response
    ? response.status >= 200 && response.status < 300
      ? 'text-emerald-400'
      : response.status >= 400 && response.status < 500
        ? 'text-amber-400'
        : 'text-rose-400'
    : '';

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">API Playground</h1>
        <p className="text-sm text-zinc-500 mt-1">Test API endpoints interactively</p>
      </header>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={cn(
              'bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer w-28',
              methodColors[method]
            )}
          >
            {METHODS.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/api/v1/datasets"
            className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
          />
          <button
            onClick={sendRequest}
            disabled={loading || !url}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Send
          </button>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Headers</p>
            <button onClick={addHeader} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => updateHeader(i, 'key', e.target.value)}
                  placeholder="Key"
                  className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => updateHeader(i, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700"
                />
                <button onClick={() => removeHeader(i)} className="p-2 text-zinc-600 hover:text-rose-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {method !== 'GET' && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-3">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Request Body</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "key": "value" }'
              rows={6}
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
        )}

        {response && (
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Response</p>
              <span className={cn('text-sm font-bold tabular-nums', statusColorClass)}>
                {response.status || 'Error'}
              </span>
              <span className="text-xs text-zinc-600 tabular-nums">{response.time}ms</span>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800/50 rounded-lg p-4 text-sm font-mono text-zinc-300 overflow-x-auto max-h-96 overflow-y-auto">
              {response.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
