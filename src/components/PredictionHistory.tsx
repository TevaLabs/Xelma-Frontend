import { useCallback, useEffect, useState } from "react";
import { predictionsApi, type UserPrediction } from "../lib/api-client";
import { LoadingState, ErrorState, EmptyState } from "./ui/StatusStates";
import { PanelHeader } from "./ui/PanelHeader";
import { formatVXLM } from "../lib/utils";

interface PredictionHistoryProps {
  userId: string | null;
}

function formatDate(value?: string): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

function formatStake(value?: string | number): string {
  if (value === undefined || value === null || value === "") return "N/A";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) return formatVXLM(num);
  return String(value);
}

export default function PredictionHistory({ userId }: PredictionHistoryProps) {
  const [history, setHistory] = useState<UserPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const predictions = await predictionsApi.getUserHistory(userId);
      setHistory(predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prediction history");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!userId) {
    return (
      <section className="bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
        <PanelHeader className="mb-4" title="Prediction History" />
        <EmptyState
          title="Connect your wallet"
          message="Connect your wallet to view your prediction history."
          className="min-h-[200px]"
        />
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
      <PanelHeader
        className="mb-4"
        title="Prediction History"
        action={
          <button
            type="button"
            className="text-sm font-medium text-[#2C4BFD] hover:underline"
            onClick={() => void loadHistory()}
            disabled={isLoading}
          >
            Refresh
          </button>
        }
      />

      {isLoading && (
        <LoadingState message="Loading prediction history..." variant="skeleton" skeletonLines={5} className="min-h-[200px]" />
      )}

      {error && !isLoading && (
        <ErrorState message={error} onRetry={loadHistory} className="min-h-[200px]" />
      )}

      {!isLoading && !error && history.length === 0 && (
        <EmptyState
          title="No predictions yet"
          message="Start making predictions to see your history here."
          className="min-h-[200px]"
        />
      )}

      {!isLoading && !error && history.length > 0 && (
        <ul className="space-y-3">
          {history.map((prediction, index) => {
            const direction = typeof prediction.direction === "string" ? prediction.direction : "UNKNOWN";
            const exactPrice =
              prediction.exactPrice === undefined || prediction.exactPrice === null
                ? null
                : String(prediction.exactPrice);
            const status = typeof prediction.status === "string" ? prediction.status : null;
            const roundId =
              prediction.roundId === undefined || prediction.roundId === null
                ? null
                : String(prediction.roundId);
            const key =
              `${String(prediction.id)}-${index}`;

            return (
              <li
                key={key}
                className="rounded-lg border border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className={direction === "UP" ? "text-green-600" : "text-pink-600"}>{direction}</span>
                    {" "}
                    • Stake: {formatStake(prediction.stake)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(typeof prediction.createdAt === "string" ? prediction.createdAt : undefined)}
                  </p>
                </div>

                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                  {roundId && <span>Round: {roundId}</span>}
                  {exactPrice && <span>Exact price: {exactPrice}</span>}
                  {status && <span>Status: {status}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
