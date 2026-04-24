
import React, { useMemo, useState } from 'react';
import type { Question } from '../types';
import { Company, Difficulty } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';

interface SidebarProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onAddNew: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
  const colors = {
    [Difficulty.Easy]: 'bg-green-100 text-green-800',
    [Difficulty.Medium]: 'bg-yellow-100 text-yellow-800',
    [Difficulty.Hard]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
};

const FilterButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; disabled?: boolean }> = ({ onClick, isActive, children, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            isActive 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ questions, selectedQuestionId, onSelectQuestion, onAddNew, isOpen, onClose, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const titleMatch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
      const difficultyMatch = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      return titleMatch && difficultyMatch;
    });
  }, [questions, searchTerm, selectedDifficulty]);

  const groupedByCompany = useMemo(() => {
    return filteredQuestions.reduce((acc, question) => {
      const company = question.company || Company.General;
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(question);
      return acc;
    }, {} as Record<Company, Question[]>);
  }, [filteredQuestions]);
  
  const companyOrder = Object.values(Company);
  const difficultyOrder: (Difficulty | 'All')[] = ['All', Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];

  return (
    <div className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col h-screen transform transition-transform duration-300 ease-in-out z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI DSA Tutor</h1>
          <p className="text-sm text-gray-500">Your interview prep partner</p>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800">
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-semibold text-gray-500">Difficulty:</span>
          {difficultyOrder.map(d => (
            <FilterButton key={d} onClick={() => setSelectedDifficulty(d)} isActive={selectedDifficulty === d} disabled={isLoading}>
              {d}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="p-4">
          <button
            onClick={onAddNew}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Question
          </button>
        </div>
        <nav className="px-2 pb-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center text-gray-500 px-2 py-8">
              <p className="font-semibold">No questions found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            companyOrder.map(company => (
              groupedByCompany[company] && (
                <div key={company} className="mt-4">
                  <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{company}</h2>
                  <ul className="mt-1 space-y-1">
                    {groupedByCompany[company].map((q) => (
                      <li key={q.id}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (isLoading) return;
                            onSelectQuestion(q.id);
                          }}
                          className={`flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                            selectedQuestionId === q.id
                              ? 'bg-indigo-100 text-primary'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          } ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <span className="flex-1 truncate pr-2">{q.title}</span>
                          <DifficultyBadge difficulty={q.difficulty} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))
          )}
        </nav>
      </div>
    </div>
  );
};