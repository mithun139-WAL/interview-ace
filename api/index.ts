
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

export default app;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    problem: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        statement: { type: Type.STRING },
        inputOutput: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              input: { type: Type.STRING },
              output: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
          },
        },
      },
    },
    edgeCases: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    approaches: {
      type: Type.OBJECT,
      properties: {
        bruteForce: {
          type: Type.OBJECT,
          properties: {
            logic: { type: Type.STRING },
            timeComplexity: {
              type: Type.OBJECT,
              properties: {
                notation: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ['notation', 'explanation']
            },
            spaceComplexity: {
              type: Type.OBJECT,
              properties: {
                notation: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ['notation', 'explanation']
            },
          },
        },
        patternIdentification: {
          type: Type.STRING,
        },
        optimal: {
          type: Type.OBJECT,
          properties: {
            logic: { type: Type.STRING },
            timeComplexity: {
              type: Type.OBJECT,
              properties: {
                notation: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ['notation', 'explanation']
            },
            spaceComplexity: {
              type: Type.OBJECT,
              properties: {
                notation: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ['notation', 'explanation']
            },
          },
        },
      },
    },
    code: {
      type: Type.OBJECT,
      properties: {
        javascript: { type: Type.STRING },
        python: { type: Type.STRING },
        java: { type: Type.STRING },
      },
    },
    followUps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
      },
    },
    diagram: {
      type: Type.OBJECT,
      properties: {
        explanation: { type: Type.STRING },
        mermaidCode: { type: Type.STRING },
      },
    },
  },
};

const cleanCode = (code: string) => {
  if (!code) return '';
  return code.replace(/```(javascript|python|java)\n|```/g, '').trim();
};

const isGeminiRateLimited = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) return true;
    try {
      const parsed = JSON.parse(error.message);
      return parsed?.error?.code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED';
    } catch {
      return false;
    }
  }
  return false;
};

const isGeminiUnavailable = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('503') || msg.includes('unavailable')) return true;
    try {
      const parsed = JSON.parse(error.message);
      return parsed?.error?.code === 503 || parsed?.error?.status === 'UNAVAILABLE';
    } catch {
      return false;
    }
  }
  return false;
};

const withRetry = async <T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isGeminiUnavailable(error) && attempt < maxAttempts - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`Gemini unavailable (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

// GET all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(questions);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown database error'
    });
  }
});

// GET single question
app.get('/api/questions/:id', async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id }
    });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST new question
app.post('/api/questions', async (req, res) => {
  const { id, title, difficulty, company, problemStatement, details } = req.body;
  try {
    const question = await prisma.question.create({
      data: { id, title, difficulty, company, problemStatement, details }
    });
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PUT update question (store final answer)
app.put('/api/questions/:id', async (req, res) => {
  const { details } = req.body;
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { details }
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// POST AI Generate Initial
app.post('/api/ai/generate', async (req, res) => {
  const { problemStatement } = req.body;
  const prompt = `
You are an expert DSA instructor. Generate a comprehensive learning guide for: "${problemStatement}"
Structure your response in valid JSON according to the schema.
Ensure that the "code" fields contain well-formatted, multi-line code (use \\n for newlines).
Ensure that the "mermaidCode" field contains valid Mermaid.js syntax (prefer flowchart TD).
IMPORTANT for Mermaid:
- Do NOT use special characters like (), [], {}, or <> inside node labels unless you wrap the label in double quotes, e.g., A["Label (info)"].
- Ensure every connection or node definition is on a new line.
`;

  try {
    const result = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    const rawText = result.text?.trim();
    if (!rawText) {
      throw new Error('Empty or blocked response from AI');
    }
    // Strip markdown formatting if Gemini includes it
    const jsonText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const details = JSON.parse(jsonText);
    details.code.javascript = cleanCode(details.code.javascript);
    details.code.python = cleanCode(details.code.python);
    details.code.java = cleanCode(details.code.java);

    res.json(details);
  } catch (error) {
    console.error('AI Generation Error:', error);
    if (isGeminiUnavailable(error)) {
      return res.status(503).json({
        error: 'AI service temporarily unavailable',
        details: 'The AI model is experiencing high demand. Please try again in a few moments.'
      });
    }
    if (isGeminiRateLimited(error)) {
      return res.status(429).json({
        error: 'AI service rate limited',
        details: 'You have exceeded your Gemini API quota or rate limit. Please try again later.'
      });
    }
    res.status(500).json({
      error: 'AI generation failed',
      details: error instanceof Error ? error.message : 'Unknown AI error'
    });
  }
});

// POST AI Refine
app.post('/api/ai/refine', async (req, res) => {
  const { problemStatement, previousAnswer, userPrompt } = req.body;
  const prompt = `
You previously generated this answer for the problem "${problemStatement}":
${JSON.stringify(previousAnswer, null, 2)}

The user has the following feedback/suggestions:
"${userPrompt}"

Please regenerate the answer incorporating this feedback. 
Maintain the same JSON structure.
Ensure that the "code" fields contain well-formatted, multi-line code (use \\n for newlines).
Ensure that the "mermaidCode" field contains valid Mermaid.js syntax (prefer flowchart TD).
IMPORTANT for Mermaid:
- Do NOT use special characters like (), [], {}, or <> inside node labels unless you wrap the label in double quotes, e.g., A["Label (info)"].
- Ensure every connection or node definition is on a new line.
`;

  try {
    const result = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    const rawText = result.text?.trim();
    if (!rawText) {
      throw new Error('Empty or blocked response from AI');
    }
    // Strip markdown formatting if Gemini includes it
    const jsonText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const details = JSON.parse(jsonText);
    details.code.javascript = cleanCode(details.code.javascript);
    details.code.python = cleanCode(details.code.python);
    details.code.java = cleanCode(details.code.java);

    res.json(details);
  } catch (error) {
    console.error('AI Refinement Error:', error);
    if (isGeminiUnavailable(error)) {
      return res.status(503).json({
        error: 'AI service temporarily unavailable',
        details: 'The AI model is experiencing high demand. Please try again in a few moments.'
      });
    }
    if (isGeminiRateLimited(error)) {
      return res.status(429).json({
        error: 'AI service rate limited',
        details: 'You have exceeded your Gemini API quota or rate limit. Please try again later.'
      });
    }
    res.status(500).json({
      error: 'AI refinement failed',
      details: error instanceof Error ? error.message : 'Unknown AI error'
    });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
