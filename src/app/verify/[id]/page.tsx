'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, ShieldOff, Loader2, HelpCircle } from 'lucide-react';
import { SynthosLogoWithText } from '@/components/ui/synthos-logo';
import { platformApi, type CertificateVerification } from '@/lib/api';

/**
 * Public certificate verification. Anyone with a certificate id can confirm a
 * dataset passed Synthos validation — no account required.
 */
export default function VerifyCertificatePage() {
  const params = useParams<{ id: string }>();
  const certificateId = params.id;
  const [state, setState] = useState<'loading' | 'unavailable' | 'done'>('loading');
  const [result, setResult] = useState<CertificateVerification | null>(null);

  useEffect(() => {
    let cancelled = false;
    platformApi
      .verifyCertificate(certificateId)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setState(data ? 'done' : 'unavailable');
      })
      .catch(() => {
        if (!cancelled) setState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.08), transparent)' }}
      />

      <header className="relative p-6">
        <Link href="/">
          <SynthosLogoWithText logoSize={30} />
        </Link>
      </header>

      <div className="relative flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-md">
          {state === 'loading' && (
            <div className="surface p-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Verifying certificate…</p>
            </div>
          )}

          {state === 'unavailable' && (
            <div className="surface p-10 text-center">
              <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-zinc-100">Verification unavailable</h1>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                We couldn&apos;t reach the verification service. Try again shortly, or contact{' '}
                <a href="mailto:support@synthos.dev" className="text-violet-400 hover:text-violet-300">support@synthos.dev</a>{' '}
                with certificate ID <span className="font-mono text-zinc-400">{certificateId}</span>.
              </p>
            </div>
          )}

          {state === 'done' && result?.valid && (
            <div className="surface p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25 flex items-center justify-center mb-4">
                  <BadgeCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h1 className="text-xl font-semibold text-zinc-100">Certificate verified</h1>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                  This dataset passed Synthos collapse-risk validation.
                </p>
              </div>
              <dl className="space-y-3 text-sm border-t border-white/[0.06] pt-6">
                <CertRow label="Certificate ID" value={result.certificate_id} mono />
                {result.dataset_name && <CertRow label="Dataset" value={result.dataset_name} />}
                {result.risk_score != null && <CertRow label="Risk score" value={`${result.risk_score}%`} />}
                {result.issued_to && <CertRow label="Issued to" value={result.issued_to} />}
                <CertRow label="Issued" value={formatDate(result.issued_at)} />
                {result.expires_at && <CertRow label="Valid until" value={formatDate(result.expires_at)} />}
              </dl>
            </div>
          )}

          {state === 'done' && result && !result.valid && (
            <div className="surface p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 ring-1 ring-rose-500/25 flex items-center justify-center mx-auto mb-4">
                <ShieldOff className="w-7 h-7 text-rose-400" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-100">Certificate not valid</h1>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                No valid certificate matches ID{' '}
                <span className="font-mono text-zinc-400 break-all">{certificateId}</span>. It may have been
                revoked, expired, or the ID was mistyped.
              </p>
            </div>
          )}

          <p className="text-center text-xs text-zinc-600 mt-6">
            Synthos validates AI training data against model-collapse risk.{' '}
            <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">Learn more</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function CertRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-zinc-500 flex-shrink-0">{label}</dt>
      <dd className={`text-zinc-200 text-right break-all ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  );
}
