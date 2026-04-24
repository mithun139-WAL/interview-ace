// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock PrismaClient before importing the app
const mockPrisma = {
  question: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock GoogleGenAI before importing the app
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
  },
}));

// Import the app after mocks are in place
const { default: app } = await import('../../server/index');

const mockQuestion = {
  id: 'q1',
  title: 'Two Sum',
  difficulty: 'Easy',
  company: 'Google',
  problemStatement: 'Given an array...',
  details: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDetails = {
  problem: {
    title: 'Two Sum',
    statement: 'Given an array...',
    inputOutput: [{ input: '[2,7]', output: '[0,1]', explanation: 'Indices 0 and 1' }],
  },
  edgeCases: ['empty array'],
  approaches: {
    bruteForce: {
      logic: 'Nested loops',
      timeComplexity: { notation: 'O(n²)', explanation: 'Two loops' },
      spaceComplexity: { notation: 'O(1)', explanation: 'No extra space' },
    },
    patternIdentification: 'Hash map pattern',
    optimal: {
      logic: 'Hash map lookup',
      timeComplexity: { notation: 'O(n)', explanation: 'Single pass' },
      spaceComplexity: { notation: 'O(n)', explanation: 'Hash map storage' },
    },
  },
  code: {
    javascript: 'function twoSum() {}',
    python: 'def two_sum(): pass',
    java: 'public int[] twoSum() {}',
  },
  followUps: [{ question: 'Sorted array?', answer: 'Two pointers' }],
  diagram: { explanation: 'Visual flow', mermaidCode: 'flowchart TD\n  A-->B' },
};

describe('GET /api/questions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of questions', async () => {
    mockPrisma.question.findMany.mockResolvedValue([mockQuestion]);
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockQuestion]);
    expect(mockPrisma.question.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
  });

  it('returns 500 on database error', async () => {
    mockPrisma.question.findMany.mockRejectedValue(new Error('DB connection failed'));
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Failed to fetch questions', details: 'DB connection failed' });
  });
});

describe('GET /api/questions/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a question by id', async () => {
    mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
    const res = await request(app).get('/api/questions/q1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQuestion);
  });

  it('returns 404 when question not found', async () => {
    mockPrisma.question.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/questions/missing');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Question not found' });
  });

  it('returns 500 on database error', async () => {
    mockPrisma.question.findUnique.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/questions/q1');
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Failed to fetch question' });
  });
});

describe('POST /api/questions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates and returns a new question', async () => {
    mockPrisma.question.create.mockResolvedValue(mockQuestion);
    const res = await request(app)
      .post('/api/questions')
      .send({ id: 'q1', title: 'Two Sum', difficulty: 'Easy', company: 'Google', problemStatement: 'Given an array...', details: null });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockQuestion);
  });

  it('returns 500 on database error', async () => {
    mockPrisma.question.create.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .post('/api/questions')
      .send({ id: 'q1', title: 'Two Sum', difficulty: 'Easy', company: 'Google', problemStatement: '...' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Failed to create question' });
  });
});

describe('PUT /api/questions/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates and returns the question', async () => {
    const updated = { ...mockQuestion, details: mockDetails };
    mockPrisma.question.update.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/questions/q1')
      .send({ details: mockDetails });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(mockPrisma.question.update).toHaveBeenCalledWith({
      where: { id: 'q1' },
      data: { details: mockDetails },
    });
  });

  it('returns 500 on database error', async () => {
    mockPrisma.question.update.mockRejectedValue(new Error('DB error'));
    const res = await request(app)
      .put('/api/questions/q1')
      .send({ details: mockDetails });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Failed to update question' });
  });
});

describe('POST /api/ai/generate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('generates and returns AI details with cleaned code', async () => {
    const rawDetails = {
      ...mockDetails,
      code: {
        javascript: '```javascript\nfunction twoSum() {}\n```',
        python: '```python\ndef two_sum(): pass\n```',
        java: '```java\npublic int[] twoSum() {}\n```',
      },
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(rawDetails) });

    const res = await request(app)
      .post('/api/ai/generate')
      .send({ problemStatement: 'Two Sum problem' });

    expect(res.status).toBe(200);
    expect(res.body.code.javascript).toBe('function twoSum() {}');
    expect(res.body.code.python).toBe('def two_sum(): pass');
    expect(res.body.code.java).toBe('public int[] twoSum() {}');
  });

  it('handles JSON wrapped in markdown code fences', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '```json\n' + JSON.stringify(mockDetails) + '\n```',
    });
    const res = await request(app)
      .post('/api/ai/generate')
      .send({ problemStatement: 'Two Sum' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ problem: mockDetails.problem });
  });

  it('handles empty code strings (cleanCode edge case)', async () => {
    const detailsWithEmptyCode = {
      ...mockDetails,
      code: { javascript: '', python: '', java: '' },
    };
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(detailsWithEmptyCode) });
    const res = await request(app)
      .post('/api/ai/generate')
      .send({ problemStatement: 'Two Sum' });
    expect(res.status).toBe(200);
    expect(res.body.code.javascript).toBe('');
    expect(res.body.code.python).toBe('');
    expect(res.body.code.java).toBe('');
  });

  it('returns 500 when AI generation fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI unavailable'));
    const res = await request(app)
      .post('/api/ai/generate')
      .send({ problemStatement: 'Two Sum' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'AI generation failed' });
  });
});

describe('POST /api/ai/refine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refines and returns updated AI details', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockDetails) });
    const res = await request(app)
      .post('/api/ai/refine')
      .send({
        problemStatement: 'Two Sum',
        previousAnswer: mockDetails,
        userPrompt: 'Add more examples',
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ problem: mockDetails.problem });
  });

  it('strips markdown fences from refined response', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '```json\n' + JSON.stringify(mockDetails) + '\n```',
    });
    const res = await request(app)
      .post('/api/ai/refine')
      .send({ problemStatement: 'Two Sum', previousAnswer: mockDetails, userPrompt: 'refine' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ problem: mockDetails.problem });
  });

  it('returns 500 with error details when AI fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));
    const res = await request(app)
      .post('/api/ai/refine')
      .send({ problemStatement: 'Two Sum', previousAnswer: mockDetails, userPrompt: 'refine' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      error: 'AI refinement failed',
      details: 'Rate limit exceeded',
    });
  });

  it('returns 500 with unknown error when non-Error is thrown', async () => {
    mockGenerateContent.mockRejectedValue('string error');
    const res = await request(app)
      .post('/api/ai/refine')
      .send({ problemStatement: 'Two Sum', previousAnswer: mockDetails, userPrompt: 'refine' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'AI refinement failed', details: 'Unknown AI error' });
  });
});
