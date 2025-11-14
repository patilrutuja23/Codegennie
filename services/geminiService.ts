import { GoogleGenAI, Type } from "@google/genai";
import type { Bug, Language } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;padding:10px;background:red;color:white;text-align:center;z-index:9999;';
  errorDiv.textContent = 'FATAL ERROR: API_KEY is not configured. The application cannot function.';
  document.body.appendChild(errorDiv);
  console.error("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const runCodeAnalysis = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return "Error: API_KEY environment variable not set. Cannot contact the AI service.";
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.3,
            topP: 0.9,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error interacting with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI service.";
  }
};

export const findBugs = async (prompt: string): Promise<Bug[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              line: { type: Type.INTEGER },
              column: { type: Type.INTEGER },
              endLine: { type: Type.INTEGER },
              endColumn: { type: Type.INTEGER },
              message: { type: Type.STRING },
              severity: { type: Type.STRING }
            },
            required: ['line', 'column', 'endLine', 'endColumn', 'message', 'severity']
          }
        }
      }
    });
    
    return JSON.parse(response.text) as Bug[];

  } catch (error) {
    console.error("Error calling Gemini API for bug detection:", error);
    if (error instanceof Error) {
        throw new Error(`Error interacting with the AI service: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI service.");
  }
};


export const generateTests = async (prompt: string): Promise<{ testCode: string }> => {
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            testCode: { type: Type.STRING }
          },
          required: ['testCode']
        }
      }
    });

    return JSON.parse(response.text);
    
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

  if (!API_KEY) {
    return "Error: API_KEY environment variable not set. Cannot contact the AI service.";
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.0,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for code execution:", error);
    if (error instanceof Error) {
        return `Error interacting with the AI service: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI service.";
  }
};
