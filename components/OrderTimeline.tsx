import React from 'react';
import { CombinedOrder } from '../types';
import { TimelinePlacedIcon, KeyIcon, DeliveryIcon, CarIcon, TimelineDeliveredIcon } from './icons';

interface Stage {
  id: string;
  label: string;
  icon: React.ElementType;
  isComplete: (order: CombinedOrder) => boolean;
  date: (order: CombinedOrder) => string | null;
}

const STAGES: Stage[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    icon: TimelinePlacedIcon,
    isComplete: (order) => !!order.details?.tasks?.registration?.orderDetails?.orderBookedDate || order.order.orderStatus.toLowerCase().includes('book'),
    date: (order) => order.details?.tasks?.registration?.orderDetails?.orderBookedDate ? new Date(order.details.tasks.registration.orderDetails.orderBookedDate).toLocaleDateString() : null,
  },
  {
    id: 'vin',
    label: 'VIN Assigned',
    icon: KeyIcon,
    isComplete: (order) => !!order.order.vin,
    date: () => null, // No specific date for this from API
  },
  {
    id: 'transit',
    label: 'In Transit',
    icon: DeliveryIcon,
    isComplete: (order) => !!order.details?.tasks?.finalPayment?.data?.etaToDeliveryCenter,
    date: (order) => order.details?.tasks?.finalPayment?.data?.etaToDeliveryCenter || null,
  },
  {
    id: 'ready',
    label: 'Ready for Delivery',
    icon: CarIcon,
    isComplete: (order) => !!order.details?.tasks?.scheduling?.apptDateTimeAddressStr,
    date: (order) => {
        const apptStr = order.details?.tasks?.scheduling?.apptDateTimeAddressStr;
        if (!apptStr) return null;
        // Try to extract just the date part if it's a long string
        const dateMatch = apptStr.match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
        return dateMatch ? dateMatch[0] : apptStr;
    }
  },
  {
    id: 'delivered',
    label: 'Delivered',
    icon: TimelineDeliveredIcon,
    isComplete: (order) => order.order.orderStatus.toLowerCase().includes('delivered'),
    date: (order) => {
        const apptStr = order.details?.tasks?.scheduling?.apptDateTimeAddressStr;
        if (!apptStr) return null;
        const dateMatch = apptStr.match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
        return dateMatch ? dateMatch[0] : null; // Return appointment date if available
    }
  },
];


const OrderTimeline: React.FC<{ combinedOrder: CombinedOrder }> = ({ combinedOrder }) => {
  const stageStatuses = STAGES.map(stage => stage.isComplete(combinedOrder));
  
  let currentStageIndex = -1;
  for (let i = stageStatuses.length - 1; i >= 0; i--) {
    if (stageStatuses[i]) {
      currentStageIndex = i;
      break;
    }
  }

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="px-5 pt-4 pb-5">
        <h3 className="text-base font-semibold mb-6 text-gray-700 dark:text-gray-300">Order Progress</h3>
        <div className="flex items-start">
          {STAGES.map((stage, index) => {
            const isComplete = stageStatuses[index];
            const isCurrent = index === currentStageIndex;

            const stageDate = isComplete ? stage.date(combinedOrder) : null;

            let circleClasses = 'bg-gray-300 dark:bg-tesla-gray-600';
            let textClasses = 'text-gray-500 dark:text-tesla-gray-500';
            let iconClasses = 'text-gray-500 dark:text-tesla-gray-400';

            if (isComplete) {
              circleClasses = 'bg-blue-600';
              textClasses = 'text-blue-600 dark:text-blue-400';
              iconClasses = 'text-white';
            }
            if (isCurrent) {
              circleClasses += ' ring-4 ring-offset-2 ring-blue-500/50 dark:ring-offset-tesla-gray-800';
              textClasses += ' font-bold';
            }

            const connectorComplete = index > 0 && index <= currentStageIndex;
            const connectorClasses = connectorComplete ? 'bg-blue-600' : 'bg-gray-300 dark:bg-tesla-gray-600';

            const StageIcon = stage.icon;

            return (
              <React.Fragment key={stage.id}>
                {index > 0 && <div className={`flex-auto h-1 mt-5 min-w-8 ${connectorClasses} transition-colors duration-500`}></div>}
                <div className="flex flex-col items-center flex-shrink-0 mx-2 w-[75px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${circleClasses} transition-all duration-500 transform group-hover:scale-110 z-10`}
                  >
                    <StageIcon className={`w-5 h-5 ${iconClasses} transition-colors duration-500`} />
                  </div>
                  <p className={`mt-2 text-xs text-center ${textClasses} transition-colors duration-500`}>{stage.label}</p>
                   {stageDate && (
                    <p className="text-xs text-gray-400 dark:text-tesla-gray-500 mt-1 whitespace-nowrap">
                      {stageDate}
                    </p>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;