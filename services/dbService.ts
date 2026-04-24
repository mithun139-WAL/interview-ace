
import type { Question, QuestionDetails } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const dbService = {
  getQuestions: async (): Promise<Question[]> => {
    const response = await fetch(`${API_BASE_URL}/questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  getQuestionById: async (id: string): Promise<Question | undefined> => {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error('Failed to fetch question');
    return response.json();
  },

  addQuestion: async (question: Question): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to add question');
    return response.json();
  },

  updateQuestionDetails: async (id: string, details: QuestionDetails): Promise<Question> => {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ details }),
    });
    if (!response.ok) throw new Error('Failed to update question');
    return response.json();
  }
};
