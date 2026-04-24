
import React, { useState } from 'react';
import { Difficulty, Company } from '../types';

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (problemStatement: string, difficulty: Difficulty, company: Company) => void;
  isLoading: boolean;
}

export const NewQuestionModal: React.FC<NewQuestionModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [problemStatement, setProblemStatement] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [company, setCompany] = useState<Company>(Company.General);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemStatement.trim()) {
      onSubmit(problemStatement.trim(), difficulty, company);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add a New Question</h2>
            <p className="text-gray-500 mb-6">Enter the problem statement and our AI will generate a complete breakdown.</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement
                </label>
                <textarea
                  id="problemStatement"
                  rows={8}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  placeholder="e.g., Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  >
                    {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Tag
                  </label>
                  <select
                    id="company"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    value={company}
                    onChange={(e) => setCompany(e.target.value as Company)}
                  >
                     {Object.values(Company).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end items-center gap-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !problemStatement.trim()}
              className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};