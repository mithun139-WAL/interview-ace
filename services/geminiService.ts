
import type { QuestionDetails } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/ai';

export const geminiService = {
  generateQuestionDetails: async (problemStatement: string): Promise<QuestionDetails> => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemStatement }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error('Failed to generate details from AI') as any;
      error.details = errorData.details;
      throw error;
    }
    return response.json();
  },

  refineQuestionDetails: async (problemStatement: string, previousAnswer: QuestionDetails, userPrompt: string): Promise<QuestionDetails> => {
    const response = await fetch(`${API_BASE_URL}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemStatement, previousAnswer, userPrompt }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error('Failed to refine details from AI') as any;
      error.details = errorData.details;
      throw error;
    }
    return response.json();
  }
};
