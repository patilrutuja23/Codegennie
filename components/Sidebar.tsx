import React from 'react';
import type { Action, Language } from '../types';
import { ACTIONS } from '../constants';

interface SidebarProps {
  onActionTrigger: (actionId: Action['id']) => void;
  selectedActionId: Action['id'];
  isLoading: boolean;
  onAutoFixAll: () => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ onActionTrigger, selectedActionId, isLoading, onAutoFixAll, language }) => {
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col">
      <div className="mb-6">
        <button
          onClick={onAutoFixAll}
          disabled={isLoading}
          title="Automatically fix all bugs and run the code"
          className="w-full text-center px-4 py-2 rounded-md transition-colors duration-200 font-bold flex items-center justify-center bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:opacity-75 disabled:cursor-not-allowed"
        >
           {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent border-solid rounded-full animate-spin mr-3"></div>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428a1 1 0 00.475 0l5 1.428a1 1 0 001.17-1.408l-7-14z" />
               </svg>
            )
           }
          Auto-Fix & Run
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2 mb-4">Actions</h2>
      <div className="flex flex-col space-y-2 flex-grow">
        {ACTIONS.map((action) => {
          return (
            <button
              key={action.id}
              onClick={() => onActionTrigger(action.id)}
              disabled={isLoading}
              title=""
              className={`w-full text-left px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium flex items-center ${
                selectedActionId === action.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              } disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isLoading && selectedActionId === action.id && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent border-solid rounded-full animate-spin mr-3"></div>
              )}
              {action.label}
            </button>
          )
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
