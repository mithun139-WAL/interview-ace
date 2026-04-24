import React from 'react';
import type { Question, QuestionDetails } from '../types';
import { CodeBlock } from './CodeBlock';
import { Mermaid } from './Mermaid';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const Section: React.FC<{ title: string; step?: number; children: React.ReactNode }> = ({ title, step, children }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
      {step && <span className="text-primary">Step {step}: </span>}
      {title}
    </h2>
    <div className="text-gray-700 leading-relaxed">{children}</div>
  </div>
);

const SkeletonLoader: React.FC = () => (
  <div className="flex-1 p-4 sm:p-8 pt-20 md:pt-8">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-xl font-semibold text-gray-700">Hold tight!</h2>
        <p className="text-gray-500">Our AI instructor is crafting a detailed explanation for you...</p>
      </div>
      <div className="animate-pulse space-y-10">
        <div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>

        <div>
          <div className="h-28 bg-gray-200 rounded-lg"></div>
        </div>

        <div>
          <div className="h-7 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>

        <div>
          <div className="h-7 bg-gray-300 rounded w-1/2 mb-6"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        <div>
          <div className="h-7 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

// A type that can be either the old or new format for backward compatibility
type OldApproach = { logic: string; timeComplexity: string; spaceComplexity: string; };
type NewApproach = QuestionDetails['approaches']['bruteForce'];
type AnyApproach = OldApproach | NewApproach;

const ApproachView: React.FC<{ title: string; approach: AnyApproach }> = ({ title, approach }) => {
  const logicPoints = approach.logic.split('\n').filter(line => line.trim() !== '');

  const timeComplexity = typeof approach.timeComplexity === 'object'
    ? approach.timeComplexity
    : { notation: approach.timeComplexity, explanation: '' };

  const spaceComplexity = typeof approach.spaceComplexity === 'object'
    ? approach.spaceComplexity
    : { notation: approach.spaceComplexity, explanation: '' };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-700 mb-2">Logic</h4>
        <ul className="list-disc list-inside space-y-1.5 text-gray-600 mb-6 pl-2">
          {logicPoints.map((point, i) => (
            <li key={i}>
              {point.replace(/^[\s\d\.\-\*]+(?:step\s+\d+[:\s]+)?/i, '').trim()}
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-800">Time Complexity</p>
            <p className="font-mono text-accent font-bold text-lg my-1">{timeComplexity.notation}</p>
            {timeComplexity.explanation && <p className="text-xs text-gray-500">{timeComplexity.explanation}</p>}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-800">Space Complexity</p>
            <p className="font-mono text-accent font-bold text-lg my-1">{spaceComplexity.notation}</p>
            {spaceComplexity.explanation && <p className="text-xs text-gray-500">{spaceComplexity.explanation}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};


interface QuestionViewProps {
  question: Question | null;
  isLoading: boolean;
  onRefine: (prompt: string) => void;
  onSave: () => void;
}

export const QuestionView: React.FC<QuestionViewProps> = ({ question, isLoading, onRefine, onSave }) => {
  const [prompt, setPrompt] = React.useState('');

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="text-center px-4">
          <h2 className="text-2xl font-semibold text-gray-600">Select a question</h2>
          <p className="text-gray-500 mt-2">Choose a problem from the sidebar to get started, or add your own.</p>
        </div>
      </div>
    );
  }

  const details = question.tempDetails || question.details;

  if (isLoading && !details) {
    return <SkeletonLoader />;
  }

  if (!details) {
      return <div className="p-8 text-center text-gray-500">Generating initial response...</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-8 pt-20 md:pt-8 pb-32">
      <Section title={details.problem.title}>
        <p className="mb-4 whitespace-pre-wrap">{details.problem.statement}</p>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Examples</h3>
        {details.problem.inputOutput.map((ex, i) => (
          <div key={i} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
            <strong className="text-gray-800">Example {i + 1}:</strong>
            <pre className="text-sm bg-gray-50 p-3 rounded-md mt-2 overflow-x-auto">
              <code className="text-green-700">Input: {ex.input}</code><br />
              <code className="text-yellow-700">Output: {ex.output}</code>
              {ex.explanation && <><br /><code className="text-gray-500">Explanation: {ex.explanation}</code></>}
            </pre>
          </div>
        ))}
      </Section>

      <Section title="Identify Edge Cases" step={1}>
        <ul className="list-disc list-inside space-y-2">
          {details.edgeCases.map((ec, i) => <li key={i}>{ec}</li>)}
        </ul>
      </Section>

      <Section title="Discuss Approach" step={2}>
        <div className="space-y-8">
          <ApproachView title="Approach 1: Brute Force" approach={details.approaches.bruteForce} />

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Pattern Identification</h3>
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-indigo-800">{details.approaches.patternIdentification}</p>
            </div>
          </div>

          <ApproachView title="Approach 2: Optimal Solution" approach={details.approaches.optimal} />
        </div>
      </Section>

      {details.diagram.mermaidCode && (
        <Section title="Visualization">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <p className="text-gray-700 leading-relaxed">{details.diagram.explanation}</p>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200">
               <Mermaid chart={details.diagram.mermaidCode} />
               <p className="text-xs text-center text-gray-500 mt-4 italic">Diagram automatically rendered by AI Studio</p>
            </div>
          </div>
        </Section>
      )}

      <Section title="Write Code" step={3}>
        <CodeBlock code={details.code} />
      </Section>

      <Section title="Answer Follow-ups">
        <div className="space-y-4">
          {details.followUps.map((fu, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800">{fu.question}</h4>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{fu.answer}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI Feedback / Satisfaction Section */}
      {question.tempDetails && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 md:left-72">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-1 w-full">
                  <div className="bg-primary/10 p-2 rounded-lg hidden sm:block">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="refine-prompt" className="sr-only">Suggestions for AI</label>
                    <input
                      id="refine-prompt"
                      type="text"
                      placeholder="Ask for changes or corrections..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && prompt.trim() && !isLoading) {
                          onRefine(prompt);
                          setPrompt('');
                        }
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { onRefine(prompt); setPrompt(''); }}
                    disabled={isLoading || !prompt.trim()}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Refine
                  </button>
                  <button
                    onClick={onSave}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    Satisfied & Save
                  </button>
                </div>
              </div>
              
              {isLoading && (
                <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-primary uppercase tracking-wider font-bold animate-pulse">
                  <SparklesIcon className="w-3 h-3" />
                  AI is crafting your response...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
