import type { Action } from '../types';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'codellama:7b'; 

/**
 * Generates code from a comment prompt using a local Ollama instance.
 * @param commentPrompt The comment text to use as a prompt.
 * @returns The generated code as a string.
 */
export const generateCodeFromComment = async (commentPrompt: string): Promise<string> => {
  const fullPrompt = `You are an expert code generation AI. Given the following comment, write the corresponding JavaScript code.
Only output the raw code. Do not include any explanations, comments, or markdown formatting like \`\`\`javascript.

Comment: "${commentPrompt}"

Code:`;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    if (result && typeof result.response === 'string') {
        return result.response.trim();
    } else {
        throw new Error('Received an invalid response structure from Ollama API.');
    }

  } catch (error) {
    console.error("Error calling Ollama API:", error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error("Could not connect to Ollama. Please ensure it's running in Docker as per the README.md instructions.");
    }
    throw error;
  }
};


/**
 * Gets AI-powered code suggestions based on the current code context.
 * @param codeContext The code leading up to the cursor.
 * @returns A single code suggestion string.
 */
export const getCodeSuggestions = async (codeContext: string): Promise<string> => {
  const fullPrompt = `You are a code completion and correction AI assistant.
Given the following JavaScript code context which ends in an incomplete or incorrect line, provide a corrected and completed version of ONLY THE LAST LINE.
Do not output any other text, just the single, corrected line of code.

<CODE_CONTEXT>
${codeContext}
</CODE_CONTEXT>

<CORRECTED_LINE>
`;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          stop: ["\n"],
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Ollama suggestions API failed with status ${response.status}`);
      return '';
    }

    const result = await response.json();
    return result?.response?.trim() || '';
    
  } catch (error) {
    console.error("Error calling Ollama for suggestions:", error);
    return ''; 
  }
};
