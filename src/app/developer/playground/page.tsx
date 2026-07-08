'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import apiClient from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Play, Loader2, Clock, RotateCcw } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
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
  PUT: {
    filled: 'bg-violet-600 text-white border-violet-600',
    outlined: 'text-violet-400 border-violet-500/40 hover:bg-violet-500/10',
    badge: 'bg-violet-500/15 text-violet-400',
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

// Paths are relative to the apiClient baseURL ('/api/v1').
const scenarios: Scenario[] = [
  { label: 'Custom Request', method: 'GET', url: '/' },
  { label: 'GET /developer/services - Service Status', method: 'GET', url: '/developer/services' },
  { label: 'GET /datasets - List Datasets', method: 'GET', url: '/datasets' },
  { label: 'GET /validations - List Validations', method: 'GET', url: '/validations' },
  {
    label: 'POST /validations/create - Create Validation',
    method: 'POST',
    url: '/validations/create',
    body: JSON.stringify(
      {
        dataset_id: 'ds_example',
        validation_type: 'comprehensive',
        options: { model_size: 'large', priority: 'high' },
      },
      null,
      2
    ),
  },
  { label: 'GET /credits/balance - Check Credits', method: 'GET', url: '/credits/balance' },
  { label: 'GET /analytics/usage - Usage Analytics', method: 'GET', url: '/analytics/usage' },
  { label: 'GET /admin/overview - Admin Overview', method: 'GET', url: '/admin/overview' },
  { label: 'GET /admin/users - List Users', method: 'GET', url: '/admin/users' },
  { label: 'GET /support/overview - Support Overview', method: 'GET', url: '/support/overview' },
  { label: 'GET /developer/overview - Dev Overview', method: 'GET', url: '/developer/overview' },
];

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (status >= 300 && status < 400) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (status >= 400 && status < 500) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (status >= 500) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}

function formatBody(data: unknown): string {
  if (data === undefined || data === null || data === '') return '';
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

let nextHistoryId = 0;

export default function DeveloperPlaygroundPage() {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('/');
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

      let status = 0;
      let body = '';

      try {
        let data: unknown;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m) && b) {
          try {
            data = JSON.parse(b);
          } catch {
            data = b;
          }
        }
        // apiClient's baseURL is '/api/v1' and it attaches the Authorization header.
        const res = await apiClient.request({ method: m, url: u, data });
        status = res.status;
        body = formatBody(res.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          status = err.response.status;
          body = formatBody(err.response.data);
        } else {
          // The apiClient response interceptor rejects with a wrapped Error
          // carrying the HTTP status and backend error code/message.
          const wrapped = err as Error & { code?: string; status?: number };
          status = wrapped.status ?? 0;
          body = formatBody({
            error: { code: wrapped.code ?? 'REQUEST_FAILED', message: wrapped.message },
          });
        }
      }

      const elapsed = Math.round(performance.now() - start);
      setResponse({ status, time: elapsed, body });

      const newId = ++nextHistoryId;
      setHistory((prev) =>
        [
          {
            id: newId,
            method: m,
            url: u,
            status,
            time: elapsed,
            requestBody: b || undefined,
            responseBody: body,
          },
          ...prev,
        ].slice(0, 10)
      );
      setLoading(false);
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

  const showBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium text-zinc-100 tracking-tight">API Playground</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Test and debug API endpoints interactively. Requests are sent through the authenticated API client.
        </p>
      </header>

      <div className="space-y-5">
        {/* Method Selector */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* URL Input (path relative to /api/v1) */}
        <div className="flex items-stretch">
          <span className="flex items-center px-3 text-sm font-mono text-zinc-500 bg-zinc-900/60 border border-r-0 border-zinc-800/50 rounded-l-lg select-none">
            /api/v1
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSelectedScenario('Custom Request');
            }}
            placeholder="/datasets"
            className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-r-lg px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

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
                  /api/v1{entry.url}
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
