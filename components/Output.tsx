import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';
import TestResults from './TestResults';
import type { Bug, TestResult, Language } from '../types';

interface OutputProps {
  aiOutput: string;
  codeOutput: string;
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
  testCode: string | null;
  testResults: TestResult[];
  onRunTests: () => void;
  bugs: Bug[];
  onQuickFix: (bug: Bug) => void;
  language: Language;
}

type Tab = 'ai' | 'code';

const Output: React.FC<OutputProps> = ({ aiOutput, codeOutput, isLoading, isExecuting, error, testCode, testResults, onRunTests, bugs, onQuickFix, language }) => {
  const [activeTab, setActiveTab] = useState<Tab>('ai');

  const renderAiContent = () => {
    if (isLoading) return <Loader />;
    if (error) {
      return (
        <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
          <h3 className="font-bold mb-2 text-red-700 dark:text-red-300">An Error Occurred</h3>
          <p className="font-mono text-sm">{error}</p>
        </div>
      );
    }
    
    if (bugs.length > 0) {
      return (
        <div>
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">Bugs Found</h3>
          <ul className="space-y-3">
            {bugs.map((bug, index) => (
              <li key={index} className="flex items-start justify-between p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex-1 mr-4">
                  <div className="flex items-center text-sm mb-1">
                    <span className={`font-bold mr-2 ${
                      bug.severity === 'error' ? 'text-red-500 dark:text-red-400' : 
                      bug.severity === 'warning' ? 'text-yellow-500 dark:text-yellow-400' : 'text-blue-500 dark:text-blue-400'
                    }`}>
                      [{bug.severity.toUpperCase()}]
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono">L{bug.line}:{bug.column}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{bug.message}</p>
                </div>
                <button 
                  onClick={() => onQuickFix(bug)} 
                  disabled={isLoading}
                  className="bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Fix
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (!aiOutput && activeTab === 'ai' && !testCode) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-xl font-semibold">AI Analysis will appear here</h3>
          <p>Select an action from the sidebar, or just start typing to trigger live bug detection.</p>
        </div>
      );
    }

    return (
      <>
        {testCode && (
           <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
              <button 
                  onClick={onRunTests}
                  disabled={language !== 'javascript'}
                  title={language !== 'javascript' ? "Test execution is only available for JavaScript" : "Run Generated Tests"}
                  className="w-full bg-yellow-600 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 10.414V14a1 1 0 102 0v-3.586l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
                  </svg>
                  <span>Run Tests</span>
              </button>
           </div>
        )}
        {testResults.length > 0 && <TestResults results={testResults} />}
        <div className="prose dark:prose-invert max-w-none prose-pre:bg-gray-200 dark:prose-pre:bg-gray-800 prose-pre:rounded-lg prose-headings:text-blue-600 dark:prose-headings:text-blue-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-500">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {aiOutput}
          </ReactMarkdown>
        </div>
      </>
    );
  };

  const renderCodeOutput = () => {
    if (isExecuting) {
      return (
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent border-solid rounded-full animate-spin"></div>
          <span>Executing code via AI...</span>
        </div>
      );
    }
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap break-words">{codeOutput}</pre>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'ai' ? 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            AI Analysis
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'code' ? 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Code Output
          </button>
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'ai' ? renderAiContent() : renderCodeOutput()}
      </div>
    </div>
  );
};

export default Output;