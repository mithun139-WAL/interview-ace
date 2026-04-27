
import type { QuestionDetails } from '../types';

const API_BASE_URL = '/api/ai';

const handleAiResponse = async (response: Response, defaultMessage: string): Promise<QuestionDetails> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 503) {
      const message = errorData.details || 'The AI model is experiencing high demand. Please try again in a few moments.';
      const error = new Error(message) as any;
      error.status = 503;
      throw error;
    }
    if (response.status === 429) {
      const message = errorData.details || 'You have exceeded the AI API quota or rate limit. Please try again later.';
      const error = new Error(message) as any;
      error.status = 429;
      throw error;
    }
    const error = new Error(defaultMessage) as any;
    error.status = response.status;
    error.details = errorData.details;
    throw error;
  }
  return response.json();
};

export const aiService = {
  generateQuestionDetails: async (problemStatement: string): Promise<QuestionDetails> => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemStatement }),
    });
    return handleAiResponse(response, 'Failed to generate details from AI');
  },

  refineQuestionDetails: async (problemStatement: string, previousAnswer: QuestionDetails, userPrompt: string): Promise<QuestionDetails> => {
    const response = await fetch(`${API_BASE_URL}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemStatement, previousAnswer, userPrompt }),
    });
    return handleAiResponse(response, 'Failed to refine details from AI');
  }
};
