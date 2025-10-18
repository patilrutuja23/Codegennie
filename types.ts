export type Language = 'javascript' | 'python' | 'java' | 'c' | 'cpp';


export type Action = {
  id: 'explain' | 'refactor' | 'docs' | 'bugs' | 'tests';
  label: string;
  prompt: (code: string, language: Language) => string;
};

export type Bug = {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
};

export type TestResult = {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
};
