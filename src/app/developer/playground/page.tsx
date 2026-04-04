'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Loader2, Clock, RotateCcw } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
type Method = (typeof METHODS)[number];

const methodButtonStyles: Record<Method, { filled: string; outlined: string; badge: string }> = {
  GET: {
    filled: 'bg-emerald-600 text-white border-emerald-600',
    outlined: 'text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  POST: {
    filled: 'bg-blue-600 text-white border-blue-600',
    outlined: 'text-blue-400 border-blue-500/40 hover:bg-blue-500/10',
    badge: 'bg-blue-500/15 text-blue-400',
  },
  PATCH: {
    filled: 'bg-amber-600 text-white border-amber-600',
    outlined: 'text-amber-400 border-amber-500/40 hover:bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  DELETE: {
    filled: 'bg-rose-600 text-white border-rose-600',
    outlined: 'text-rose-400 border-rose-500/40 hover:bg-rose-500/10',
    badge: 'bg-rose-500/15 text-rose-400',
  },
};

interface HistoryEntry {
  id: number;
  method: Method;
  url: string;
  status: number;
  time: number;
  requestBody?: string;
  responseBody: string;
}

interface Scenario {
  label: string;
  method: Method;
  url: string;
  body?: string;
}

const scenarios: Scenario[] = [
  { label: 'Custom Request', method: 'GET', url: '/api/v1/' },
  { label: 'GET /health - Health Check', method: 'GET', url: '/health' },
  { label: 'GET /api/v1/datasets - List Datasets', method: 'GET', url: '/api/v1/datasets' },
  {
    label: 'POST /api/v1/validations/create - Create Validation',
    method: 'POST',
    url: '/api/v1/validations/create',
    body: JSON.stringify(
      {
        dataset_id: 'ds_example',
        validation_type: 'full',
        config: { threshold: 0.95, checks: ['schema', 'distribution', 'outliers'] },
      },
      null,
      2
    ),
  },
  { label: 'GET /api/v1/credits/balance - Check Credits', method: 'GET', url: '/api/v1/credits/balance' },
  { label: 'GET /api/v1/admin/overview - Admin Overview', method: 'GET', url: '/api/v1/admin/overview' },
  { label: 'GET /api/v1/admin/users - List Users', method: 'GET', url: '/api/v1/admin/users' },
  { label: 'GET /api/v1/support/overview - Support Overview', method: 'GET', url: '/api/v1/support/overview' },
  { label: 'GET /api/v1/developer/overview - Dev Overview', method: 'GET', url: '/api/v1/developer/overview' },
];

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (status >= 300 && status < 400) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (status >= 400 && status < 500) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (status >= 500) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}

let nextHistoryId = 0;

export default function DeveloperPlaygroundPage() {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('/api/v1/');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    time: number;
    body: string;
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('Custom Request');

  const handleScenarioChange = useCallback((value: string) => {
    setSelectedScenario(value);
    const scenario = scenarios.find((s) => s.label === value);
    if (scenario) {
      setMethod(scenario.method);
      setUrl(scenario.url);
      setRequestBody(scenario.body ?? '');
    }
  }, []);

  const sendRequest = useCallback(
    async (reqMethod?: Method, reqUrl?: string, reqBody?: string) => {
      const m = reqMethod ?? method;
      const u = reqUrl ?? url;
      const b = reqBody ?? requestBody;

      setLoading(true);
      setResponse(null);
      const start = performance.now();

      try {
        const res = await fetch(u, {
          method: m,
          headers: {
            'Content-Type': 'application/json',
          },
          body: ['POST', 'PATCH', 'PUT', 'DELETE'].includes(m) && b ? b : undefined,
        });

        const elapsed = Math.round(performance.now() - start);
        const responseText = await res.text();

        let formatted: string;
        try {
          formatted = JSON.stringify(JSON.parse(responseText), null, 2);
        } catch {
          formatted = responseText;
        }

        setResponse({ status: res.status, time: elapsed, body: formatted });

        const newId = ++nextHistoryId;
        setHistory((prev) =>
          [
            {
              id: newId,
              method: m,
              url: u,
              status: res.status,
              time: elapsed,
              requestBody: b || undefined,
              responseBody: formatted,
            },
            ...prev,
          ].slice(0, 10)
        );
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        setResponse({ status: 0, time: elapsed, body: String(err) });
      } finally {
        setLoading(false);
      }
    },
    [method, url, requestBody]
  );

  const replayEntry = useCallback(
    (entry: HistoryEntry) => {
      setMethod(entry.method);
      setUrl(entry.url);
      setRequestBody(entry.requestBody ?? '');
      setSelectedScenario('Custom Request');
      sendRequest(entry.method, entry.url, entry.requestBody);
    },
    [sendRequest]
  );

  const showBody = ['POST', 'PATCH', 'DELETE'].includes(method);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">API Playground</h1>
        <p className="text-sm text-zinc-500 mt-1">Test and debug API endpoints interactively</p>
      </header>

      <div className="space-y-5">
        {/* Method Selector - 4 colored buttons */}
        <div className="flex items-center gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'px-4 py-2 text-sm font-bold rounded-lg border transition-all duration-150',
                method === m
                  ? methodButtonStyles[m].filled
                  : methodButtonStyles[m].outlined
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* URL Input */}
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSelectedScenario('Custom Request');
          }}
          placeholder="/api/v1/..."
          className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        />

        {/* Pre-built Scenarios */}
        <div>
          <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5 block">
            Pre-built Scenarios
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
            className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {scenarios.map((s) => (
              <option key={s.label} value={s.label} className="bg-zinc-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Request Body */}
        {showBody && (
          <div>
            <label className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5 block">
              Request Body
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{ "key": "value" }'
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800/50 rounded-lg px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-colors"
            />
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={() => sendRequest()}
          disabled={loading || !url}
          className={cn(
            'w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-lg transition-all duration-200',
            'bg-blue-600 hover:bg-blue-500 text-white',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Play size={18} />
              Send Request
            </>
          )}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">Response</p>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-md border tabular-nums',
                getStatusColor(response.status)
              )}
            >
              {response.status || 'ERR'}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-500 tabular-nums">
              <Clock size={12} />
              {response.time}ms
            </span>
          </div>
          <pre className="bg-zinc-950 border border-zinc-800/50 rounded-lg p-4 text-sm font-mono text-zinc-300 overflow-x-auto max-h-[28rem] overflow-y-auto">
            {response.body}
          </pre>
        </div>
      )}

      {/* Request History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
            Request History
          </p>
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl divide-y divide-zinc-800/40">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => replayEntry(entry)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800/20 transition-colors group"
              >
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    methodButtonStyles[entry.method].badge
                  )}
                >
                  {entry.method}
                </span>
                <span className="flex-1 text-sm text-zinc-400 font-mono truncate">
                  {entry.url}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded border tabular-nums',
                    getStatusColor(entry.status)
                  )}
                >
                  {entry.status || 'ERR'}
                </span>
                <span className="text-xs text-zinc-600 tabular-nums w-16 text-right">
                  {entry.time}ms
                </span>
                <RotateCcw
                  size={12}
                  className="text-zinc-700 group-hover:text-blue-400 transition-colors"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
