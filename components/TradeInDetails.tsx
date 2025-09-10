import React, { useState } from 'react';
import { ChevronDownIcon, TradeInIcon } from './icons';

interface TradeInDetailsProps {
  tradeInData: any; // The structure is complex, using any for now.
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline py-2">
    <dt className="text-sm text-gray-500 dark:text-tesla-gray-400">{label}</dt>
    <dd className="text-sm font-semibold text-gray-800 dark:text-white text-right break-all">{value || 'N/A'}</dd>
  </div>
);

const TradeInDetails: React.FC<TradeInDetailsProps> = ({ tradeInData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tradeInData || tradeInData.tradeInIntent !== 'Yes' || !tradeInData.currentVehicle) {
    return null;
  }

  const { currentVehicle, tradeInVehicle, status, currencyCode } = tradeInData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatStatus = (statusString: string) => {
    if (!statusString) return 'N/A';
    return statusString.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const formatCondition = (conditionString: string) => {
    if (!conditionString) return 'N/A';
    return conditionString.charAt(0).toUpperCase() + conditionString.slice(1).toLowerCase();
  };


  const summary = `${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}`;
  const offer = formatCurrency(currentVehicle.finalOffer);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-tesla-gray-700/50">
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="w-full flex justify-between items-center text-left py-2 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-tesla-gray-800"
        aria-expanded={isExpanded}
        aria-controls="trade-in-details-content"
      >
        <div className="flex items-center space-x-3">
          <TradeInIcon className="w-6 h-6 text-gray-400 dark:text-tesla-gray-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Trade-In Details</h3>
            <p className="text-sm text-gray-500 dark:text-tesla-gray-400">{summary} - <span className="font-semibold text-gray-700 dark:text-tesla-gray-200">{offer}</span></p>
          </div>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-tesla-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <div 
        id="trade-in-details-content"
        className={`transition-all duration-500 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="mt-2 p-4 bg-gray-50 dark:bg-tesla-gray-900/50 rounded-lg border border-gray-200 dark:border-tesla-gray-700">
            <dl className="divide-y divide-gray-200 dark:divide-tesla-gray-700/50">
              <DetailRow label="Status" value={formatStatus(status)} />
              <DetailRow label="License Plate" value={tradeInVehicle?.Registration?.RegistrationNumber} />
              <DetailRow label="Mileage" value={tradeInVehicle?.Mileage ? `${tradeInVehicle.Mileage.toLocaleString()} ${tradeInVehicle.OdometerType || ''}`.trim() : 'N/A'} />
              <DetailRow label="Offer Expires" value={formatDate(tradeInVehicle?.SelectedValuation?.ValuationExpireDate)} />
              <DetailRow label="Reported Condition" value={formatCondition(tradeInVehicle?.vehicleCondition?.OverallCondition)} />
              <DetailRow label="Damage Reported" value={tradeInVehicle?.Damage?.IsDamage ? 'Yes' : 'No'} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInDetails;