import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import CodeEditor from './components/Editor';
import Output from './components/Output';
import { runCodeAnalysis, findBugs, generateTests, getQuickFix, fixAllBugs, runCodeWithGemini } from './services/geminiService';
import { generateCodeFromComment } from './services/ollamaService';
import { ACTIONS, DEFAULT_CODES } from './constants';
import type { Action, Bug, TestResult, Language } from './types';

type EditorMarker = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState<string>(DEFAULT_CODES[language]);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [codeOutput, setCodeOutput] = useState<string>('Click "Run Code" to see the output here.');
  const [testCode, setTestCode] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isAnalyzingLive, setIsAnalyzingLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<Action['id']>(ACTIONS[0].id);
  const [markers, setMarkers] = useState<EditorMarker[]>([]);
  const [bugReports, setBugReports] = useState<Bug[]>([]);
  const liveAnalysisTimeoutRef = useRef<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const mapSeverityToMonaco = (severity: Bug['severity']): number => {
    switch (severity) {
      case 'error': return 8; 
      case 'warning': return 4; 
      case 'info': return 2;
      default: return 2;
    }
  };
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODES[newLanguage]);
    setMarkers([]);
    setBugReports([]);
    setAiOutput('');
    setCodeOutput('Click "Run Code" to see the output here.');
    setError(null);
    setTestCode(null);
    setTestResults([]);
    setSelectedActionId(ACTIONS[0].id);
  };

  const processBugResults = useCallback((bugs: Bug[]) => {
    setBugReports(bugs);
    const monacoMarkers = bugs.map(bug => ({
        startLineNumber: bug.line, startColumn: bug.column,
        endLineNumber: bug.endLine, endColumn: bug.endColumn,
        message: bug.message, severity: mapSeverityToMonaco(bug.severity),
    }));
    setMarkers(monacoMarkers);
  }, []);
  
  const runLiveBugAnalysis = useCallback(async (currentCode: string, currentLanguage: Language) => {
      if (!currentCode.trim()) {
        setMarkers([]);
        setBugReports([]);
        return;
      };
      setIsAnalyzingLive(true);
      setAiOutput('');
      try {
        const prompt = ACTIONS.find(a => a.id === 'bugs')!.prompt(currentCode, currentLanguage);
        const bugs = await findBugs(prompt);
        processBugResults(bugs);
      } catch (e) {
        console.error("Live analysis failed:", e);
      } finally {
        setIsAnalyzingLive(false);
      }
  }, [processBugResults]);

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (liveAnalysisTimeoutRef.current) {
        clearTimeout(liveAnalysisTimeoutRef.current);
    }
    liveAnalysisTimeoutRef.current = window.setTimeout(() => {
        runLiveBugAnalysis(newCode, language);
    }, 1500); 
  };

  const handleActionTrigger = useCallback(async (actionId: Action['id']) => {
    setSelectedActionId(actionId);
    const selectedAction = ACTIONS.find(a => a.id === actionId);
    if (!selectedAction || !code) return;

    setIsLoading(true);
    setError(null);
    setAiOutput('');
    setMarkers([]);
    setBugReports([]);
    setTestCode(null);
    setTestResults([]);

    try {
      const prompt = selectedAction.prompt(code, language);
      if (selectedAction.id === 'bugs') {
        const bugs = await findBugs(prompt);
        processBugResults(bugs);
        if (bugs.length === 0) {
          setAiOutput("No bugs found! The code appears to be robust.");
        } else {
          setAiOutput(''); 
        }
      } else if (selectedAction.id === 'tests') {
         const { testCode: generatedTestCode } = await generateTests(prompt);
         setTestCode(generatedTestCode);
         setAiOutput("### Tests Generated\n\nFor JavaScript, you can click 'Run Tests'. For other languages, copy the generated test code into your local test environment.");
      } else {
        const result = await runCodeAnalysis(prompt);
        setAiOutput(result);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setAiOutput('');
    } finally {
      setIsLoading(false);
    }
  }, [code, language, processBugResults]);

  const handleRunCode = useCallback(async () => {
    if (language === 'javascript') {
      const logs: string[] = [];
      const originalConsole = { ...console };
      
      console.log = (...args) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalConsole.log.apply(console, args);
      };
      console.error = (...args) => {
        logs.push(`ERROR: ${args.map(arg => String(arg)).join(' ')}`);
        originalConsole.error.apply(console, args);
      };
      console.warn = (...args) => {
        logs.push(`WARN: ${args.map(arg => String(arg)).join(' ')}`);
        originalConsole.warn.apply(console, args);
      };

      try {
        new Function(code)();
        const output = logs.length > 0 ? logs.join('\n') : 'Code executed without errors and with no console output.';
        setCodeOutput(output);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setCodeOutput(`Execution Error:\n${errorMessage}`);
      } finally {
        Object.assign(console, originalConsole);
      }
    } else {
      setIsExecuting(true);
      setCodeOutput('');
      try {
        const output = await runCodeWithGemini(code, language);
        setCodeOutput(output);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during AI execution.';
        setCodeOutput(`Execution failed:\n${errorMessage}`);
      } finally {
        setIsExecuting(false);
      }
    }
  }, [code, language]);
  
  const handleGenerateCode = useCallback(async (prompt: string, lineNumber: number) => {
    if (isGeneratingCode) return;

    setIsGeneratingCode(true);
    setError(null);

    try {
      const generatedCode = await generateCodeFromComment(prompt, language);
      
      setCode(currentCode => {
        const lines = currentCode.split('\n');
        lines.splice(lineNumber, 0, generatedCode);
        return lines.join('\n');
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during code generation.';
      setError(errorMessage);
      setAiOutput('');
    } finally {
      setIsGeneratingCode(false);
    }
  }, [isGeneratingCode, language]);


  const handleRunTests = useCallback(() => {
    if (!testCode || language !== 'javascript') return;
    const results: TestResult[] = [];
    if ((window as any).generatedTests) {
      delete (window as any).generatedTests;
    }
    
    try {
      new Function(code + '\n\n' + testCode)();
      const testsToRun = (window as any).generatedTests;
      if (!Array.isArray(testsToRun)) {
        throw new Error("Generated test suite ('generatedTests') is not available or not an array.");
      }
      
      for (const test of testsToRun) {
        try {
          test.fn();
          results.push({ name: test.name, status: 'pass' });
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Test failed with an unknown error.';
          results.push({ name: test.name, status: 'fail', message: errorMessage });
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during test execution.';
      results.push({ name: "Test Runner Error", status: 'fail', message: errorMessage });
    } finally {
       if ((window as any).generatedTests) {
         delete (window as any).generatedTests;
       }
    }
    setTestResults(results);
  }, [code, testCode, language]);

  const handleQuickFix = useCallback(async (bug: Bug) => {
    setIsFixing(true);
    setError(null);
    try {
        const fixedCodeSnippet = await getQuickFix(code, bug, language);
        
        const lines = code.split('\n');
        const startLine = bug.line - 1; 
        const endLine = bug.endLine - 1;
        const linesToRemove = endLine - startLine + 1;
        lines.splice(startLine, linesToRemove, fixedCodeSnippet);
        const newCode = lines.join('\n');

        setCode(newCode);

        await runLiveBugAnalysis(newCode, language);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during quick fix.';
        setError(errorMessage);
    } finally {
        setIsFixing(false);
    }
  }, [code, language, runLiveBugAnalysis]);

  const handleAutoFixAll = useCallback(async () => {
    setIsFixing(true);
    setError(null);
    setAiOutput('Starting Auto-Fix process...');
    try {
        const bugPrompt = ACTIONS.find(a => a.id === 'bugs')!.prompt(code, language);
        const bugs = await findBugs(bugPrompt);

        if (bugs.length === 0) {
            setAiOutput('No bugs found.');
            handleRunCode();
            return;
        }

        setAiOutput(`Found ${bugs.length} bugs. Asking AI to fix them...`);
        const fixedCode = await fixAllBugs(code, bugs, language);
        setCode(fixedCode);
        setMarkers([]);
        setBugReports([]);

        setAiOutput('AI has fixed the code. Now running it...');
        setTimeout(() => {
            handleRunCode();
        }, 100);
        
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during auto-fix.';
        setError(errorMessage);
        setAiOutput('');
    } finally {
        setIsFixing(false);
    }
  }, [code, language, handleRunCode]);

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          selectedActionId={selectedActionId}
          onActionTrigger={handleActionTrigger}
          onAutoFixAll={handleAutoFixAll}
          isLoading={isLoading || isGeneratingCode || isFixing || isExecuting}
          language={language}
        />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-300 dark:bg-gray-700">
          <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <CodeEditor 
              value={code} 
              onChange={handleCodeChange} 
              markers={markers}
              onRunCode={handleRunCode}
              onGenerateCode={handleGenerateCode}
              onQuickFix={handleQuickFix}
              isGeneratingCode={isGeneratingCode || isFixing}
              isAnalyzingLive={isAnalyzingLive}
              isExecuting={isExecuting}
              language={language}
              onLanguageChange={handleLanguageChange}
              theme={theme}
            />
          </div>
          <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Output 
              aiOutput={aiOutput}
              codeOutput={codeOutput}
              isLoading={isLoading || isFixing}
              isExecuting={isExecuting}
              error={error}
              testCode={testCode}
              testResults={testResults}
              onRunTests={handleRunTests}
              bugs={bugReports}
              onQuickFix={handleQuickFix}
              language={language}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App; 
