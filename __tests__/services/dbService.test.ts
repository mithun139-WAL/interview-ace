import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService } from '../../services/dbService';
import type { Question, QuestionDetails } from '../../types';
import { Difficulty, Company } from '../../types';

const mockDetails: QuestionDetails = {
  problem: {
    title: 'Two Sum',
    statement: 'Given an array...',
    inputOutput: [{ input: '[2,7,11,15], target=9', output: '[0,1]' }],
  },
  edgeCases: ['empty array'],
  approaches: {
    bruteForce: {
      logic: 'Nested loops',
      timeComplexity: { notation: 'O(n²)', explanation: 'Two loops' },
      spaceComplexity: { notation: 'O(1)', explanation: 'No extra space' },
    },
    patternIdentification: 'Hash map',
    optimal: {
      logic: 'Hash map lookup',
      timeComplexity: { notation: 'O(n)', explanation: 'Single pass' },
      spaceComplexity: { notation: 'O(n)', explanation: 'Hash map' },
    },
  },
  code: { javascript: 'const a = 1;', python: 'a = 1', java: 'int a = 1;' },
  followUps: [{ question: 'What if sorted?', answer: 'Two pointers' }],
  diagram: { explanation: 'Visual', mermaidCode: 'graph TD; A-->B' },
};

const mockQuestion: Question = {
  id: 'q1',
  title: 'Two Sum',
  difficulty: Difficulty.Easy,
  company: Company.Google,
  problemStatement: 'Given an array...',
  details: mockDetails,
};

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('dbService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getQuestions', () => {
    it('returns list of questions on success', async () => {
      vi.stubGlobal('fetch', mockFetch(200, [mockQuestion]));
      const result = await dbService.getQuestions();
      expect(result).toEqual([mockQuestion]);
      expect(fetch).toHaveBeenCalledWith('/api/questions');
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', mockFetch(500, { error: 'Server error' }));
      await expect(dbService.getQuestions()).rejects.toThrow('Failed to fetch questions');
    });
  });

  describe('getQuestionById', () => {
    it('returns question when found', async () => {
      vi.stubGlobal('fetch', mockFetch(200, mockQuestion));
      const result = await dbService.getQuestionById('q1');
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith('/api/questions/q1');
    });

    it('returns undefined on 404', async () => {
      vi.stubGlobal('fetch', mockFetch(404, { error: 'Not found' }));
      const result = await dbService.getQuestionById('missing');
      expect(result).toBeUndefined();
    });

    it('throws on other non-ok response', async () => {
      vi.stubGlobal('fetch', mockFetch(500, {}));
      await expect(dbService.getQuestionById('q1')).rejects.toThrow('Failed to fetch question');
    });
  });

  describe('addQuestion', () => {
    it('posts and returns created question', async () => {
      vi.stubGlobal('fetch', mockFetch(200, mockQuestion));
      const result = await dbService.addQuestion(mockQuestion);
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith(
        '/api/questions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockQuestion),
        })
      );
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', mockFetch(500, {}));
      await expect(dbService.addQuestion(mockQuestion)).rejects.toThrow('Failed to add question');
    });
  });

  describe('updateQuestionDetails', () => {
    it('puts and returns updated question', async () => {
      vi.stubGlobal('fetch', mockFetch(200, mockQuestion));
      const result = await dbService.updateQuestionDetails('q1', mockDetails);
      expect(result).toEqual(mockQuestion);
      expect(fetch).toHaveBeenCalledWith(
        '/api/questions/q1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ details: mockDetails }),
        })
      );
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', mockFetch(500, {}));
      await expect(dbService.updateQuestionDetails('q1', mockDetails)).rejects.toThrow(
        'Failed to update question'
      );
    });
  });
});
