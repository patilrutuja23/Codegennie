import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not configured in Vercel environment variables.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API_KEY not configured on server' });
  }

  const { action, prompt } = req.body;

  if (!action || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: action, prompt' });
  }

  try {
    switch (action) {
      case 'analyze':
        return await handleAnalyze(prompt, res);
      case 'findBugs':
        return await handleFindBugs(prompt, res);
      case 'generateTests':
        return await handleGenerateTests(prompt, res);
      case 'getQuickFix':
        return await handleGetQuickFix(prompt, res);
      case 'fixAllBugs':
        return await handleFixAllBugs(prompt, res);
      case 'runCode':
        return await handleRunCode(prompt, res);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error(`Error in ${action}:`, error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

async function handleAnalyze(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
    },
  });
  return res.status(200).json({ result: response.text });
}

async function handleFindBugs(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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
            severity: { type: Type.STRING },
          },
          required: ['line', 'column', 'endLine', 'endColumn', 'message', 'severity'],
        },
      },
    },
  });

  const bugs = JSON.parse(response.text);
  return res.status(200).json({ result: bugs });
}

async function handleGenerateTests(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          testCode: { type: Type.STRING },
        },
        required: ['testCode'],
      },
    },
  });

  const testResult = JSON.parse(response.text);
  return res.status(200).json({ result: testResult });
}

async function handleGetQuickFix(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
    },
  });
  return res.status(200).json({ result: response.text });
}

async function handleFixAllBugs(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
    },
  });
  return res.status(200).json({ result: response.text });
}

async function handleRunCode(prompt: string, res: VercelResponse) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
    },
  });
  return res.status(200).json({ result: response.text });
}
