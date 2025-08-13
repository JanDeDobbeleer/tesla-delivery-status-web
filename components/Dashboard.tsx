
import React, { useState, useEffect, useCallback } from 'react';
import { TeslaTokens, CombinedOrder, OrderDiff, HistoricalSnapshot } from '../types';
import { getAllOrderData } from '../services/tesla';
import { compareObjects } from '../utils/helpers';
import OrderCard from './OrderCard';
import Spinner from './Spinner';
import { TeslaLogo, LogoutIcon, RefreshIcon, SunIcon, MoonIcon } from './icons';

interface DashboardProps {
  tokens: TeslaTokens;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tokens, onLogout, theme, toggleTheme }) => {
  const [orders, setOrders] = useState<CombinedOrder[]>([]);
  const [diffs, setDiffs] = useState<Record<string, OrderDiff>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCompareOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newOrders = await getAllOrderData(tokens.access_token);
      const latestDiffs: Record<string, OrderDiff> = {};

      for (const newCombinedOrder of newOrders) {
        const rn = newCombinedOrder.order.referenceNumber;
        const historyKey = `tesla-order-history-${rn}`;
        
        let history: HistoricalSnapshot[] = [];
        try {
            const storedHistoryJson = localStorage.getItem(historyKey);
            if(storedHistoryJson) {
                history = JSON.parse(storedHistoryJson);
            }
        } catch (e) {
            console.error("Failed to parse history from localStorage for", rn, e);
            history = []; // Start fresh if parsing fails
        }

        const lastSnapshotData = history.length > 0 ? history[history.length - 1].data : null;

        if (lastSnapshotData) {
          const diff = compareObjects(lastSnapshotData, newCombinedOrder);
          if (Object.keys(diff).length > 0) {
            history.push({ timestamp: Date.now(), data: newCombinedOrder });
            localStorage.setItem(historyKey, JSON.stringify(history));
            latestDiffs[rn] = diff;
          }
        } else {
          // First time seeing this order, initialize history
          const initialHistory = [{ timestamp: Date.now(), data: newCombinedOrder }];
          localStorage.setItem(historyKey, JSON.stringify(initialHistory));
        }
      }

      setOrders(newOrders);
      setDiffs(latestDiffs);

    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Could not retrieve order information. The session might be invalid.');
      if (err instanceof Error && err.message.includes('401')) {
          setTimeout(onLogout, 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [tokens.access_token, onLogout]);

  useEffect(() => {
    fetchAndCompareOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    if (loading && orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <Spinner />
          <p className="mt-4 text-lg text-gray-600 dark:text-tesla-gray-300">Fetching your order data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center mt-10">
            <div className="text-center bg-red-100 dark:bg-tesla-red/10 border border-red-200 dark:border-tesla-red text-red-700 dark:text-tesla-red px-6 py-4 rounded-lg max-w-md">
                <p className="font-bold text-lg">An Error Occurred</p>
                <p className="mt-1">{error}</p>
            </div>
        </div>
      );
    }

    if (orders.length > 0) {
      if (orders.length === 1) {
        const singleOrder = orders[0];
        return (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <OrderCard
                key={singleOrder.order.referenceNumber}
                combinedOrder={singleOrder}
                diff={diffs[singleOrder.order.referenceNumber] || {}}
              />
            </div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {orders.map((combinedOrder) => (
            <OrderCard
              key={combinedOrder.order.referenceNumber}
              combinedOrder={combinedOrder}
              diff={diffs[combinedOrder.order.referenceNumber] || {}}
            />
          ))}
        </div>
      );
    }

    return (
        <div className="flex justify-center mt-10">
            <div className="text-center bg-white dark:bg-tesla-gray-800/50 border border-gray-200 dark:border-tesla-gray-700 p-10 rounded-2xl shadow-sm max-w-md">
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No Orders Found</h2>
                <p className="text-gray-500 dark:text-tesla-gray-400">We couldn't find any orders associated with your account.</p>
            </div>
        </div>
    );
  };

  const iconButtonClasses = "p-2 rounded-full hover:bg-gray-200 dark:hover:bg-tesla-gray-700 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-tesla-gray-900 active:scale-90 active:bg-gray-300 dark:active:bg-tesla-gray-600";

  return (
    <div className="min-h-screen w-full max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 dark:border-tesla-gray-700/50">
        <div className="flex items-center space-x-4">
            <TeslaLogo className="w-8 h-8 text-tesla-red" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Delivery Status</h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
           <button
            onClick={toggleTheme}
            className={iconButtonClasses}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
          <button
            onClick={fetchAndCompareOrders}
            disabled={loading}
            className={`${iconButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-transparent dark:disabled:bg-transparent`}
            aria-label="Refresh Orders"
          >
            <RefreshIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className={iconButtonClasses}
            aria-label="Logout"
          >
            <LogoutIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
