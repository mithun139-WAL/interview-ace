import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from '../../services/geminiService';
import type { QuestionDetails } from '../../types';

const mockDetails: QuestionDetails = {
  problem: {
    title: 'Two Sum',
    statement: 'Given an array...',
    inputOutput: [{ input: '[2,7,11,15]', output: '[0,1]' }],
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

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateQuestionDetails', () => {
    it('posts problem statement and returns details', async () => {
      vi.stubGlobal('fetch', mockFetch(200, mockDetails));
      const result = await geminiService.generateQuestionDetails('Given an array...');
      expect(result).toEqual(mockDetails);
      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemStatement: 'Given an array...' }),
        })
      );
    });

    it('throws with details when response is not ok', async () => {
      const errorBody = { details: 'API quota exceeded' };
      vi.stubGlobal('fetch', mockFetch(500, errorBody));
      await expect(
        geminiService.generateQuestionDetails('Given an array...')
      ).rejects.toMatchObject({
        message: 'Failed to generate details from AI',
        details: 'API quota exceeded',
      });
    });

    it('throws without details when error response has no details field', async () => {
      vi.stubGlobal('fetch', mockFetch(500, {}));
      await expect(
        geminiService.generateQuestionDetails('Given an array...')
      ).rejects.toMatchObject({
        message: 'Failed to generate details from AI',
      });
    });

    it('throws even when error response json fails to parse', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      }));
      await expect(
        geminiService.generateQuestionDetails('problem')
      ).rejects.toThrow('Failed to generate details from AI');
    });
  });

  describe('refineQuestionDetails', () => {
    it('posts all required fields and returns refined details', async () => {
      vi.stubGlobal('fetch', mockFetch(200, mockDetails));
      const result = await geminiService.refineQuestionDetails(
        'Given an array...',
        mockDetails,
        'Add more examples'
      );
      expect(result).toEqual(mockDetails);
      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/refine',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemStatement: 'Given an array...',
            previousAnswer: mockDetails,
            userPrompt: 'Add more examples',
          }),
        })
      );
    });

    it('throws with details when response is not ok', async () => {
      vi.stubGlobal('fetch', mockFetch(429, { details: 'Rate limited' }));
      await expect(
        geminiService.refineQuestionDetails('problem', mockDetails, 'refine')
      ).rejects.toMatchObject({
        message: 'Failed to refine details from AI',
        details: 'Rate limited',
      });
    });

    it('throws even when error response json fails to parse', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      }));
      await expect(
        geminiService.refineQuestionDetails('problem', mockDetails, 'refine')
      ).rejects.toThrow('Failed to refine details from AI');
    });
  });
});
