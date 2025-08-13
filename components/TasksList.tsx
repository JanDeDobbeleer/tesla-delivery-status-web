
import React from 'react';
import { OrderDetails, TeslaTask } from '../types';
import { TimelineDeliveredIcon as CheckIcon, CircleIcon, ArrowRightIcon } from './icons';

interface TasksListProps {
  tasksData: OrderDetails['tasks'];
}

const TasksList: React.FC<TasksListProps> = ({ tasksData }) => {
  if (!tasksData) {
    return (
      <div className="p-5 text-center text-gray-500 dark:text-tesla-gray-400">
        No task data available.
      </div>
    );
  }

  const tasks: TeslaTask[] = Object.values(tasksData)
    .filter((task: any): task is TeslaTask => task && typeof task === 'object' && 'id' in task && 'order' in task)
    .sort((a, b) => a.order - b.order);

  if (tasks.length === 0) {
    return (
      <div className="p-5 text-center text-gray-500 dark:text-tesla-gray-400">
        No tasks to display.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      {tasks.map(task => (
        <div
          key={task.id}
          className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 ${
            task.enabled ? 'bg-white dark:bg-tesla-gray-800 border-gray-200 dark:border-tesla-gray-700' : 'bg-gray-50 dark:bg-tesla-gray-800/50 border-gray-200/50 dark:border-tesla-gray-700/50'
          }`}
        >
          <div className="flex-shrink-0 pt-1">
            {task.complete ? (
              <CheckIcon className="w-6 h-6 text-green-500" />
            ) : (
              <CircleIcon className={`w-6 h-6 ${task.enabled ? 'text-blue-500' : 'text-gray-400 dark:text-tesla-gray-600'}`} />
            )}
          </div>
          <div className="flex-grow">
            <h4 className={`font-semibold ${task.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-tesla-gray-400'}`}>
              {task.card?.title || task.strings?.name || task.id}
            </h4>
            <p className={`text-sm mt-1 ${task.enabled ? 'text-gray-600 dark:text-tesla-gray-300' : 'text-gray-400 dark:text-tesla-gray-500'}`}>
              {task.card?.subtitle || 'No details available.'}
            </p>
            {task.card?.messageTitle && task.card?.messageBody && (
              <div className="mt-2 text-sm bg-gray-100 dark:bg-tesla-gray-700/50 p-3 rounded-lg">
                <p className="font-semibold text-gray-800 dark:text-tesla-gray-200">{task.card.messageTitle.replace(/\\n/g, '')}</p>
                <p className="text-gray-600 dark:text-tesla-gray-300">{task.card.messageBody}</p>
              </div>
            )}
          </div>
          {task.enabled && task.card?.buttonText?.cta && (
            <div className="flex-shrink-0 self-center">
              <button className="flex items-center space-x-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md transition-transform duration-150 active:scale-95">
                <span>{task.card.buttonText.cta}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TasksList;
