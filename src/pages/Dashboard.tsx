import { ChatSidebar } from "../components/ChatSidebar";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import type { PredictionData } from "../components/PredictionControls";

const Dashboard = () => {
  const handlePrediction = (data: PredictionData) => {
    console.log("Prediction made:", data);
  };

  return (
    <div className="dashboard flex min-h-full">
      <ChatSidebar />

      <div className="flex-1 ml-0 md:ml-80 transition-[margin] duration-300 ease-in-out p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center: Prediction controls (Issue: core prediction area) */}
          <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
            <PredictionCard
              isWalletConnected={true}
              isRoundActive={true}
              onPrediction={handlePrediction}
            />
          </div>

          {/* Right: Price chart and placeholder */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Price Chart */}
            <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
              <PriceChart height={280} />
            </div>

            <div className="mt-5 p-4 bg-black/5 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                142 Playing Now
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
