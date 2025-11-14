import type { Action, Language } from './types';

export const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
];

export const ACTIONS: Action[] = [
  {
    id: 'explain',
    label: 'Explain Code',
    prompt: (code, language) => `You are an expert programmer and code reviewer. Explain the following ${language} code snippet in a clear and concise way. 
    Describe its purpose, how it works, and any potential improvements. 
    Format your response using Markdown with clear headings.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\``,
  },
  {
    id: 'refactor',
    label: 'Refactor Code',
    prompt: (code, language) => `You are an expert programmer specializing in clean code and refactoring. Refactor the following ${language} code to improve its readability, performance, and maintainability. 
    Provide the refactored code and a bulleted list of the changes you made and why. 
    Format your response using Markdown, with the refactored code inside a labeled code block.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\``,
  },
  {
    id: 'bugs',
    label: 'Find Bugs',
    prompt: (code, language) => `You are an expert static analysis tool. Analyze the following ${language} code for potential bugs, logical errors, or edge cases. 
    Identify the exact start and end line and column number for each issue. The 'endColumn' should point to the character after the problematic code.
    Provide your findings as a JSON array of objects. Each object must have these keys: "line" (number), "column" (number), "endLine" (number), "endColumn" (number), "message" (string), and "severity" (one of "error", "warning", or "info").
    If no bugs are found, return an empty array.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\``,
  },
  {
    id: 'tests',
    label: 'Generate Tests',
    prompt: (code, language) => `You are a software engineer who specializes in testing. Write a suite of unit tests for the following ${language} code.
    The primary output format MUST be a single JSON object with one key: "testCode".
    For JavaScript, the "testCode" value should be a string that, when executed, creates a global 'generatedTests' array. Each element in 'generatedTests' should be an object with "name" (string) and "fn" (function) keys. You MUST define a simple 'assert' object within the test code string for assertions.
    For other languages (like Python, Java, C++), the "testCode" value should be a string containing the complete test code in a standard framework (e.g., pytest for Python, JUnit for Java, Google Test for C++).

    Example of the required "testCode" string structure for JavaScript:
    \`
    const assert = {
      strictEqual(actual, expected, message) {
        if (actual !== expected) {
          throw new Error(message || \`Assertion failed: Expected \${expected}, but got \${actual}\`);
        }
      }
    };
    window.generatedTests = [
      {
        name: 'should handle base case n = 0',
        fn: () => {
          assert.strictEqual(fibonacci(0), 0);
        }
      }
    ];
    \`

    Original Code to be tested:
    \`\`\`${language}
    ${code}
    \`\`\``,
  },
];

export const DEFAULT_CODES: Record<Language, string> = {
  javascript: `console.log("Hello World!, Welcome to CodeGennie. Start your coding journey...");

`,
  python: `print("Hello World!, Welcome to CodeGennie. Start your coding journey...")

`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!, Welcome to CodeGennie. Start your coding journey...");
    }
}

`,
  c: `#include <stdio.h>

int main() {
    printf("Hello World!, Welcome to CodeGennie. Start your coding journey...\n");
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!, Welcome to CodeGennie. Start your coding journey..." << endl;
    return 0;
}
`
};