import { useCallback, useEffect, useState } from "react";
import { predictionsApi, type UserPrediction } from "../lib/api-client";
import { LoadingState, ErrorState, EmptyState } from "./ui/StatusStates";
import { PanelHeader } from "./ui/PanelHeader";
import { formatVXLM, formatRelativeTime } from "../lib/utils";

interface PredictionHistoryProps {
  userId: string | null;
  optimisticPrediction?: UserPrediction | null;
}

function formatStake(value?: string | number): string {
  if (value === undefined || value === null || value === "") return "N/A";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) return formatVXLM(num);
  return String(value);
}

export default function PredictionHistory({ userId, optimisticPrediction }: PredictionHistoryProps) {
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

  const handleExportCSV = useCallback(() => {
    if (history.length === 0) return;

    const headers = ["direction", "stake", "result", "timestamp"];
    const rows = history.map((prediction) => {
      const direction = typeof prediction.direction === "string" ? prediction.direction : "";
      const stake = prediction.stake !== undefined && prediction.stake !== null ? String(prediction.stake) : "";
      const result = typeof prediction.status === "string" ? prediction.status : "";
      const timestamp = typeof prediction.createdAt === "string" ? prediction.createdAt : "";

      const escape = (val: string) => {
        const cleaned = val.replace(/"/g, '""');
        if (cleaned.includes(",") || cleaned.includes('"') || cleaned.includes("\n") || cleaned.includes("\r")) {
          return `"${cleaned}"`;
        }
        return cleaned;
      };

      return [
        escape(direction),
        escape(stake),
        escape(result),
        escape(timestamp)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prediction_history_${userId ?? "user"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [history, userId]);

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
          variant="no-history"
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={handleExportCSV}
              disabled={history.length === 0 || isLoading}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="text-sm font-medium text-[#2C4BFD] hover:underline disabled:opacity-50"
              onClick={() => void loadHistory()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>
        }
      />

      {isLoading && (
        <LoadingState message="Loading prediction history..." variant="skeleton" skeletonLines={5} className="min-h-[200px]" />
      )}

      {error && !isLoading && (
        <ErrorState message={error} onRetry={loadHistory} className="min-h-[200px]" />
      )}

      {!isLoading && !error && history.length === 0 && !optimisticPrediction && (
        <EmptyState
          title="No predictions yet"
          message="Start making predictions to see your history here."
          className="min-h-[200px]"
          variant="no-history"
        />
      )}

      {!isLoading && !error && (history.length > 0 || optimisticPrediction) && (
        <ul className="space-y-3">
          {(optimisticPrediction ? [optimisticPrediction, ...history.filter(h => h.id !== optimisticPrediction.id)] : history).map((prediction, index) => {
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
            const isPending = status === 'PENDING';
            const isFailed = status === 'FAILED';

            return (
              <li
                key={key}
                className={`rounded-lg border p-3 bg-gray-50 dark:bg-gray-900/30 ${isPending ? 'border-yellow-400/50 opacity-80' : isFailed ? 'border-red-400/50 opacity-50' : 'border-gray-100 dark:border-gray-700'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className={direction === "UP" ? "text-green-600" : "text-pink-600"}>{direction}</span>
                    {" "}
                    • Stake: {formatStake(prediction.stake)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
  const raw = prediction.createdAt;
  if (typeof raw !== "string") return "Unknown time";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return formatRelativeTime(date);
})()}
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
