import React from 'react';
import { TeslaTask } from '../types';
import { ArrowRightIcon } from './icons';

interface SchedulingBannerProps {
  schedulingTask?: TeslaTask & {
    isSelfSchedulingAvailable?: boolean;
    selfSchedulingUrl?: string;
  };
}

const SchedulingBanner: React.FC<SchedulingBannerProps> = ({ schedulingTask }) => {
  const canSchedule = schedulingTask?.isSelfSchedulingAvailable === true && schedulingTask?.selfSchedulingUrl;

  if (!canSchedule) {
    return null;
  }

  return (
    <div className="p-5 border-b border-gray-200 dark:border-tesla-gray-700/50 animate-fade-in-up">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-200 dark:border-blue-500/30">
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">
            {schedulingTask.card?.title || "Schedule Your Delivery"}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {schedulingTask.card?.subtitle || "It's time to book your delivery appointment."}
          </p>
        </div>
        <a
          href={schedulingTask.selfSchedulingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 active:scale-95 animate-subtle-pulse"
        >
          <span>{schedulingTask.card?.buttonText?.cta || 'Schedule Now'}</span>
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </a>
      </div>
    </div>
  );
};

export default SchedulingBanner;
