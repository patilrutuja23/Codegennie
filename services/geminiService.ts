import type { Bug, Language } from '../types';

// Backend API endpoint - works in both development and production
const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

const callBackendAPI = async (action: string, prompt: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Error calling backend API (${action}):`, error);
    throw error;
  }
};

export const runCodeAnalysis = async (prompt: string): Promise<string> => {
  try {
    const result = await callBackendAPI('analyze', prompt);
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error interacting with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI service.";
  }
};

export const findBugs = async (prompt: string): Promise<Bug[]> => {
  try {
    const result = await callBackendAPI('findBugs', prompt);
    return result as Bug[];
  } catch (error) {
    console.error("Error calling Gemini API for bug detection:", error);
    if (error instanceof Error) {
        throw new Error(`Error interacting with the AI service: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI service.");
  }
};

export const generateTests = async (prompt: string): Promise<{ testCode: string }> => {
  try {
    const result = await callBackendAPI('generateTests', prompt);
    return result;
  } catch (error) {
    console.error("Error calling Gemini API for test generation:", error);
    if (error instanceof Error) {
        throw new Error(`Error interacting with the AI service: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI service.");
  }
};

export const getQuickFix = async (code: string, bug: Bug, language: Language): Promise<string> => {
    const lines = code.split('\n');
    const snippet = lines.slice(bug.line - 1, bug.endLine).join('\n');

    const prompt = `You are an automated code fixing tool. 
Given the following ${language} code snippet and a specific bug report, provide the corrected line(s) of code. 
Only output the raw code for the replacement. Do not include explanations, comments, or markdown formatting.

Bug: "${bug.message}" on line ${bug.line}.

Problematic Code:
\`\`\`${language}
${snippet}
\`\`\`

Corrected Code:`;

    const response = await runCodeAnalysis(prompt);
    return response.replace(new RegExp(`\`\`\`(${language})?\\n|\\n\`\`\`|\`\`\``, 'g'), '').trim();
};

export const fixAllBugs = async (code: string, bugs: Bug[], language: Language): Promise<string> => {
    const bugList = bugs.map(b => `- L${b.line}: ${b.message}`).join('\n');
    const prompt = `You are an expert AI programmer. The following ${language} code has several bugs. 
Your task is to fix all of them and return the complete, corrected code. 
Do not add any new functionality or explanations. Only output the raw, corrected ${language} code without any markdown formatting.

Bugs found:
${bugList}

Original Code:
\`\`\`${language}
${code}
\`\`\`

Corrected Code:`;

    const response = await runCodeAnalysis(prompt);
    return response.replace(new RegExp(`\`\`\`(${language})?\\n|\\n\`\`\`|\`\`\``, 'g'), '').trim();
};

export const runCodeWithGemini = async (code: string, language: Language): Promise<string> => {
  const prompt = `You are a powerful code execution engine.
Execute the following ${language} code and return ONLY its standard output as a raw string.
If the code produces any runtime errors, return the full error message, including stack trace if available.
Do not provide any explanations, comments, or markdown formatting. Just the raw output or error.

Code:
\`\`\`${language}
${code}
\`\`\``;

  try {
    const result = await callBackendAPI('runCode', prompt);
    return result;
  } catch (error) {
    console.error("Error calling Gemini API for code execution:", error);
    if (error instanceof Error) {
        return `Error interacting with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI service.";
  }
};
