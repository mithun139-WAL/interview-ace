
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

export default app;

app.use(cors());
app.use(express.json());

const generateWithGroq = async (prompt: string, retries = 3): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert DSA instructor. You must always return responses in valid JSON format.
Expected JSON structure:
{
  "problem": {
    "title": "string",
    "statement": "string",
    "inputOutput": [{ "input": "string", "output": "string", "explanation": "string" }]
  },
  "edgeCases": ["string"],
  "approaches": {
    "bruteForce": {
      "logic": "string",
      "timeComplexity": { "notation": "string", "explanation": "string" },
      "spaceComplexity": { "notation": "string", "explanation": "string" }
    },
    "patternIdentification": "string",
    "optimal": {
      "logic": "string",
      "timeComplexity": { "notation": "string", "explanation": "string" },
      "spaceComplexity": { "notation": "string", "explanation": "string" }
    }
  },
  "code": {
    "javascript": "string",
    "python": "string",
    "java": "string"
  },
  "followUps": [{ "question": "string", "answer": "string" }],
  "diagram": {
    "explanation": "string",
    "mermaidCode": "string"
  }
}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'openai/gpt-oss-120b',
          temperature: 1,
          max_completion_tokens: 3072, // Slightly reduced to help with TPM limits
          top_p: 1,
          stream: false,
          reasoning_effort: "medium",
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        const errorBody = await response.json().catch(() => ({}));
        const retryAfter = parseFloat(errorBody.error?.message?.match(/try again in ([\d.]+)s/)?.[1] || '1');
        console.warn(`Rate limited. Retrying in ${retryAfter}s... (Attempt ${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, retryAfter * 1000 + 100)); // Buffer of 100ms
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error (${response.status}): ${JSON.stringify(errorBody)}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from Groq');
      }

      return content;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.error(`Error on attempt ${i + 1}:`, error);
      await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Simple backoff
    }
  }
  throw new Error('Max retries reached');
};


const cleanCode = (code: string) => {
  if (!code) return '';
  return code.replace(/```(javascript|python|java)\n|```/g, '').trim();
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
You are an expert DSA instructor. Generate a detailed and comprehensive learning guide for: "${problemStatement}"
Structure your response in valid JSON according to the schema.
Ensure that the "code" fields contain well-formatted, multi-line code (use \\n for newlines).
Ensure that the "mermaidCode" field contains valid Mermaid.js syntax (prefer flowchart TD).
IMPORTANT:
- Provide a detailed, step-by-step logic explanation for both the Brute Force and Optimal approaches.
- Generate at least 3 relevant follow-up questions with concise but informative answers.
- For Mermaid, do NOT use special characters like (), [], {}, or <> inside node labels unless you wrap the label in double quotes, e.g., A["Label (info)"].
- Ensure every connection or node definition is on a new line.
`;

  try {
    const jsonText = (await generateWithGroq(prompt)).trim();
    if (!jsonText) {
      throw new Error('Empty or blocked response from AI');
    }

    let details: any;
    try {
      details = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse failed. Raw text:', jsonText);
      return res.status(500).json({
        error: 'AI response was truncated or invalid',
        details: 'The AI generated a malformed response. Please try again.'
      });
    }

    if (typeof details.code !== 'object' || details.code === null) {
      details.code = {};
    }
    details.code.javascript = cleanCode(details.code.javascript);
    details.code.python = cleanCode(details.code.python);
    details.code.java = cleanCode(details.code.java);

    res.json(details);
  } catch (error) {
    console.error('AI Generation Error:', error);
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
IMPORTANT:
- Ensure the explanations for Brute Force and Optimal approaches remain detailed and step-by-step.
- Ensure there are at least 3 relevant follow-up questions.
- For Mermaid, do NOT use special characters like (), [], {}, or <> inside node labels unless you wrap the label in double quotes, e.g., A["Label (info)"].
- Ensure every connection or node definition is on a new line.
`;

  try {
    const jsonText = (await generateWithGroq(prompt)).trim();
    if (!jsonText) {
      throw new Error('Empty or blocked response from AI');
    }

    let details: any;
    try {
      details = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse failed in Refine. Raw text:', jsonText);
      return res.status(500).json({
        error: 'AI refinement was truncated or invalid',
        details: 'The AI generated a malformed response during refinement.'
      });
    }

    if (typeof details.code !== 'object' || details.code === null) {
      details.code = {};
    }
    details.code.javascript = cleanCode(details.code.javascript);
    details.code.python = cleanCode(details.code.python);
    details.code.java = cleanCode(details.code.java);

    res.json(details);
  } catch (error) {
    console.error('AI Refinement Error:', error);
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
