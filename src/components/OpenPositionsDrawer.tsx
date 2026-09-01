import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowUp, BriefcaseBusiness, ExternalLink, X } from 'lucide-react';
import type { Round } from '../lib/api-client';
import { Link } from 'react-router-dom';

export interface OpenPosition {
  id: string | number;
  asset?: string;
  direction?: string;
  stake?: string | number;
  exactPrice?: string | number;
  roundId?: string | number;
  potentialPayout?: string | number;
  createdAt?: string;
}

interface OpenPositionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  positions: OpenPosition[];
  activeRound?: Round | null;
}

function formatAmount(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '—';
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString()} vXLM` : String(value);
}

function getRoundHref(roundId: string | number): string {
  return `/dashboard?round=${encodeURIComponent(String(roundId))}`;
}

function getDirection(position: OpenPosition): 'UP' | 'DOWN' {
  return String(position.direction ?? '').toUpperCase() === 'DOWN' ? 'DOWN' : 'UP';
}

export default function OpenPositionsDrawer({
  isOpen,
  onClose,
  positions,
  activeRound = null,
}: OpenPositionsDrawerProps) {
  const activeRoundId = activeRound?.id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0F172A] text-white shadow-2xl outline-none animate-in slide-in-from-right duration-200"
          aria-modal="true"
          data-testid="open-positions-drawer"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-lg font-bold">
                <BriefcaseBusiness className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                Open positions
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-400">
                Track predictions that are still open in the active round.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Close open positions"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {positions.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <BriefcaseBusiness className="h-8 w-8 text-cyan-300" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-white">No open positions</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                  Your active predictions will appear here while they are waiting to settle.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Open prediction positions">
                {positions.map((position) => {
                  const direction = getDirection(position);
                  const roundId = position.roundId ?? activeRoundId;
                  const isUp = direction === 'UP';

                  return (
                    <li
                      key={String(position.id)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              isUp ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
                            }`}
                          >
                            {isUp ? (
                              <ArrowUp className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="h-5 w-5" aria-hidden="true" />
                            )}
                            <span className="sr-only">{direction} prediction</span>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {position.asset ?? 'Current market'}
                            </p>
                            <p className={`text-sm font-medium ${isUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {direction}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-medium text-cyan-200">
                          Open
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-slate-500">Stake</dt>
                          <dd className="mt-1 font-medium text-slate-200">{formatAmount(position.stake)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Potential payout</dt>
                          <dd className="mt-1 font-medium text-slate-200">{formatAmount(position.potentialPayout)}</dd>
                        </div>
                        {position.exactPrice !== undefined && (
                          <div className="col-span-2">
                            <dt className="text-slate-500">Target price</dt>
                            <dd className="mt-1 font-medium text-slate-200">{position.exactPrice}</dd>
                          </div>
                        )}
                      </dl>

                      {roundId !== undefined && roundId !== null && (
                        <Link
                          to={getRoundHref(roundId)}
                          className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          aria-label={`View round ${roundId}`}
                        >
                          View round <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {activeRoundId !== undefined && activeRoundId !== null && (
            <div className="border-t border-white/10 px-5 py-4 sm:px-6">
              <Link
                to={getRoundHref(activeRoundId)}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                View active round
              </Link>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
