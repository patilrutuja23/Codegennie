import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { getCodeSuggestions } from '../services/ollamaService';
import type { Bug, Language } from '../types';
import { LANGUAGES } from '../constants';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  markers: any[]; // monaco.editor.IMarkerData[]
  onRunCode: () => void;
  onGenerateCode: (prompt: string, lineNumber: number) => Promise<void>;
  onQuickFix: (bug: Bug) => void;
  isGeneratingCode: boolean;
  isAnalyzingLive: boolean;
  isExecuting: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, markers, onRunCode, onGenerateCode, onQuickFix, isGeneratingCode, isAnalyzingLive, isExecuting, language, onLanguageChange }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const suggestionTimeoutRef = useRef<number | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const completionProviderRef = useRef<any>(null);
  const codeActionProviderRef = useRef<any>(null);
  const commandRef = useRef<any>(null);

  const setupProviders = (monaco: Monaco, currentLanguage: Language) => {
    // Dispose previous providers if they exist
    completionProviderRef.current?.dispose();
    codeActionProviderRef.current?.dispose();
    commandRef.current?.dispose();

    // AI Autocomplete Provider
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider(currentLanguage, {
      triggerCharacters: ['.', '(', ' ', '=', ':', '>', '<', '"', "'"],
      provideCompletionItems: (model, position) => {
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }
        return new Promise((resolve) => {
          suggestionTimeoutRef.current = window.setTimeout(async () => {
            setIsSuggesting(true);
            try {
              const codeUntilCursor = model.getValueInRange({
                startLineNumber: 1, startColumn: 1,
                endLineNumber: position.lineNumber, endColumn: position.column,
              });

              if (codeUntilCursor.trim().length < 10) {
                 resolve({ suggestions: [] });
                 return;
              }

              const suggestionText = await getCodeSuggestions(codeUntilCursor, currentLanguage);
              if (!suggestionText) {
                resolve({ suggestions: [] });
                return;
              }
              
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column
              };

              const suggestions = [{
                label: { label: suggestionText, description: "AI Suggestion" },
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: suggestionText,
                range: range,
                detail: "Powered by Ollama CodeLlama",
              }];
              resolve({ suggestions });
            } catch (error) {
              console.error('Failed to get AI suggestions:', error);
              resolve({ suggestions: [] });
            } finally {
              setIsSuggesting(false);
            }
          }, 750); // Debounce delay
        });
      },
    });

    // Code Action (Quick Fix) Provider
    codeActionProviderRef.current = monaco.languages.registerCodeActionProvider(currentLanguage, {
      provideCodeActions: (model, range, context) => {
        const actions = context.markers
          .filter(marker => marker.severity === monaco.MarkerSeverity.Error || marker.severity === monaco.MarkerSeverity.Warning)
          .map(marker => {
            const bug: Bug = {
              line: marker.startLineNumber,
              column: marker.startColumn,
              endLine: marker.endLineNumber,
              endColumn: marker.endColumn,
              message: marker.message,
              severity: marker.severity === monaco.MarkerSeverity.Error ? 'error' : 'warning'
            };

            return {
              title: 'AI Quick Fix',
              kind: 'quickfix',
              isPreferred: true,
              diagnostics: [marker],
              command: {
                id: 'trigger-quick-fix',
                title: 'AI Quick Fix',
                arguments: [bug],
              },
            };
          });
        return { actions, dispose: () => {} };
      },
    });

    // Register the command that the CodeAction will trigger
    commandRef.current = monaco.editor.registerCommand('trigger-quick-fix', (accessor, bug) => {
        onQuickFix(bug);
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add Ctrl+Enter action for code generation
    editor.addAction({
      id: 'generate-code-from-comment',
      label: 'Generate Code From Comment',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      run: async (ed) => {
        if (isGeneratingCode) return;
        const position = ed.getPosition();
        if (!position) return;
        const lineContent = ed.getModel()?.getLineContent(position.lineNumber).trim();
        if (!lineContent) return;
        
        const commentRegex = /^\s*(\/\/|\#|--|\/\*)/;
        if (commentRegex.test(lineContent)) {
          const prompt = lineContent.replace(commentRegex, '').replace(/\*\/$/, '').trim();
          if (prompt) {
            await onGenerateCode(prompt, position.lineNumber);
          }
        }
      },
    });

    // Initial provider setup for the default language
    setupProviders(monaco, language);
  };
  
  // Re-register providers when the language changes
  useEffect(() => {
    if (monacoRef.current) {
      setupProviders(monacoRef.current, language);
    }
  }, [language, onQuickFix]);

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'ai-code-analysis', markers);
      }
    }
  }, [markers]);

  return (
    <div className="h-full w-full flex flex-col relative">
       <div className="bg-gray-800 text-sm font-medium text-gray-400 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-gray-700 text-white rounded-md pl-2 pr-8 py-1 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Select programming language"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
               <svg className="w-4 h-4 text-gray-400 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">(Ctrl+Enter in a comment to generate code)</span>
             {(isSuggesting || isAnalyzingLive) && (
                <div className="flex items-center space-x-1 text-xs text-blue-400">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent border-solid rounded-full animate-spin"></div>
                    <span>{isSuggesting ? 'AI thinking...' : 'Analyzing...'}</span>
                </div>
            )}
        </div>
        <button 
          onClick={onRunCode}
          disabled={isGeneratingCode || isExecuting}
          title="Run Code"
          className="bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed w-24 justify-center"
        >
          {isExecuting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent border-solid rounded-full animate-spin"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
          <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {isGeneratingCode && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-gray-900 bg-opacity-80 p-4 rounded-lg flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent border-solid rounded-full animate-spin"></div>
            <span className="text-sm text-gray-200">{isGeneratingCode ? 'Generating code...' : 'Fixing code...'}</span>
            </div>
        )}
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly: isGeneratingCode,
            quickSuggestions: true,
            // FIX: The type for `lightbulb.enabled` is 'ShowLightbulbIconMode', which requires a string value like 'on' instead of a boolean.
            lightbulb: { enabled: 'on' },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;