import React from 'react';
import type { TestResult } from '../types';

interface TestResultsProps {
  results: TestResult[];
}

const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  if (results.length === 0) return null;

  const passedCount = results.filter(r => r.status === 'pass').length;
  const failedCount = results.length - passedCount;

  return (
    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">Test Results</h3>
      <div className="flex space-x-4 mb-4 text-sm">
        <span className="font-semibold text-green-600 dark:text-green-400">Passed: {passedCount}</span>
        <span className="font-semibold text-red-600 dark:text-red-400">Failed: {failedCount}</span>
      </div>
      <ul className="space-y-2">
        {results.map((result, index) => (
          <li key={index} className="flex items-start p-2 rounded-md bg-gray-200/50 dark:bg-gray-700/50">
            {result.status === 'pass' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <span className="text-gray-800 dark:text-gray-300 text-sm font-medium">{result.name}</span>
              {result.status === 'fail' && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 p-2 rounded font-mono">{result.message}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestResults;