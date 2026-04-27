
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { QuestionView } from './components/QuestionView';
import { NewQuestionModal } from './components/NewQuestionModal';
import { dbService } from './services/dbService';
import { aiService } from './services/aiService';
import type { Question, Difficulty, Company } from './types';
import { MenuIcon } from './components/icons/MenuIcon';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await dbService.getQuestions();
        setQuestions(data);
      } catch (err) {
        setError("Failed to load questions from database.");
      }
    };
    loadQuestions();
  }, []);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || null;

  const handleSelectQuestion = useCallback(async (id: string) => {
    setIsSidebarOpen(false);
    setSelectedQuestionId(id);
    const question = questions.find(q => q.id === id);
    if (question && !question.details) {
      setIsLoading(true);
      setError(null);
      try {
        const details = await aiService.generateQuestionDetails(question.problemStatement);
        // We don't save immediately now, we wait for user satisfaction
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, tempDetails: details } : q));
      } catch (err: any) {
        const message = err.details ? `${err.message}: ${err.details}` : err.message;
        setError(message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [questions]);

  const handleRefineAnswer = async (id: string, userPrompt: string) => {
    const question = questions.find(q => q.id === id);
    if (!question || (!question.details && !question.tempDetails)) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const currentDetails = question.tempDetails || question.details!;
      const details = await aiService.refineQuestionDetails(question.problemStatement, currentDetails, userPrompt);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, tempDetails: details } : q));
    } catch (err: any) {
      const message = err.details ? `${err.message}: ${err.details}` : err.message;
      setError(message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnswer = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question || !question.tempDetails) return;

    setIsLoading(true);
    try {
      const updatedQuestion = await dbService.updateQuestionDetails(id, question.tempDetails);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, details: updatedQuestion.details, tempDetails: undefined } : q));
    } catch (err) {
      setError("Failed to save answer to database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewQuestion = async (problemStatement: string, difficulty: Difficulty, company: Company) => {
    setIsLoading(true);
    setError(null);
    try {
      // First generate initial answer
      const details = await aiService.generateQuestionDetails(problemStatement);
      const newQuestion: Question = {
        id: new Date().getTime().toString(),
        title: details.problem.title,
        difficulty,
        company,
        problemStatement,
        // Store in tempDetails first
        tempDetails: details
      };
      
      // Save basic question info to DB
      await dbService.addQuestion({ ...newQuestion, details: undefined });
      
      setQuestions(prev => [...prev, newQuestion]);
      setSelectedQuestionId(newQuestion.id);
      setIsModalOpen(false);
      setIsSidebarOpen(false);
    } catch (err: any) {
       const message = err.details ? `${err.message}: ${err.details}` : err.message;
       setError(message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen font-sans bg-gray-100 relative overflow-hidden">
      <Sidebar
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        onSelectQuestion={handleSelectQuestion}
        onAddNew={() => setIsModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isLoading={isLoading}
      />
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" aria-hidden="true" />}

      <main className="flex-1 flex flex-col overflow-hidden">
         {error && (
            <div className="bg-red-100 text-red-700 p-4 text-center text-sm border-b border-red-200 flex justify-between items-center">
                <span><strong>Error:</strong> {error}</span>
                <button onClick={() => setError(null)} className="font-bold text-lg leading-none" aria-label="Close error message">&times;</button>
            </div>
         )}
         <div className="flex-1 flex flex-col overflow-y-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden fixed top-4 left-4 z-20 p-2 bg-white/80 rounded-full text-gray-800 backdrop-blur-sm shadow-md" aria-label="Open sidebar">
                <MenuIcon className="w-6 h-6" />
            </button>
            <QuestionView 
              question={selectedQuestion} 
              isLoading={isLoading && selectedQuestionId !== null} 
              onRefine={(prompt) => handleRefineAnswer(selectedQuestionId!, prompt)}
              onSave={() => handleSaveAnswer(selectedQuestionId!)}
            />
         </div>
      </main>
      <NewQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddNewQuestion}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;