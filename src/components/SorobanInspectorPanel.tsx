import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PanelHeader } from './ui/PanelHeader';
import type { SorobanInspectorSnapshot } from '../lib/xelma-contract';

interface SorobanInspectorPanelProps {
  inspector: SorobanInspectorSnapshot | null;
  isLoading: boolean;
  onRefresh: () => void;
}

interface InspectorRow {
  label: string;
  value: string;
}

function formatInspectedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function buildRows(inspector: SorobanInspectorSnapshot | null): InspectorRow[] {
  if (!inspector) return [];
  const fields = inspector.fields ?? {};
  const rows: InspectorRow[] = [];

  if (fields.positionSide) rows.push({ label: 'Position side', value: fields.positionSide });
  if (fields.stake) rows.push({ label: 'Stake', value: fields.stake });
  if (fields.roundId) rows.push({ label: 'Round ID', value: fields.roundId });
  if (fields.poolSplit) rows.push({ label: 'Pool split', value: fields.poolSplit });

  const inspectedAt = formatInspectedAt(inspector.inspectedAt);
  if (inspectedAt) rows.push({ label: 'Last inspected', value: inspectedAt });

  return rows;
}

/**
 * Structured glass HUD card for the read-only Soroban wallet position/round
 * inspector — replaces the previous raw `<pre>{JSON.stringify(...)}</pre>`
 * dump with labeled rows, while keeping a "View raw JSON" disclosure for
 * developers who still want the raw payload.
 */
export default function SorobanInspectorPanel({ inspector, isLoading, onRefresh }: SorobanInspectorPanelProps) {
  const [showRaw, setShowRaw] = useState(false);
  const rows = buildRows(inspector);
  const isRpcFallback = Boolean(inspector?.error);

  return (
    <section
      className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5 shadow-inner shadow-cyan-950/30"
      aria-labelledby="soroban-inspector-title"
    >
      <PanelHeader
        className="mb-3"
        title="Soroban Inspector"
        subtitle="Read-only wallet position and round state."
        status={
          isRpcFallback
            ? { label: 'RPC fallback', variant: 'warning' }
            : inspector?.status === 'ok'
              ? { label: 'Live', variant: 'success' }
              : undefined
        }
        action={
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg border border-cyan-400/30 p-2 text-cyan-200 transition-colors hover:text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Refresh Soroban inspector"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        }
      />
      <h2 id="soroban-inspector-title" className="sr-only">
        Soroban Inspector
      </h2>

      {isRpcFallback && (
        <p
          className="mb-3 rounded border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200"
          role="status"
        >
          RPC fallback: {inspector?.error}
        </p>
      )}

      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && rows.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : rows.length > 0 ? (
          <dl className="space-y-1.5">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{row.label}</dt>
                <dd className="truncate font-mono text-xs font-bold text-cyan-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            <p className="text-xs text-gray-500">
              {isRpcFallback
                ? 'No position data available — showing the RPC fallback state above.'
                : 'No position data yet. Connect a wallet with an active prediction to see it here.'}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="mt-3 text-[11px] font-semibold text-cyan-300/80 underline-offset-2 hover:text-cyan-200 hover:underline"
        aria-expanded={showRaw}
      >
        {showRaw ? 'Hide raw JSON' : 'View raw JSON'}
      </button>

      {showRaw && (
        <pre
          className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#020617] p-3 font-mono text-[11px] text-cyan-100"
        >
          {JSON.stringify(inspector ?? { status: isLoading ? 'loading' : 'not connected' }, null, 2)}
        </pre>
      )}
    </section>
  );
}
