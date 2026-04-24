// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionView } from '../../components/QuestionView';
import type { Question, QuestionDetails } from '../../types';
import { Difficulty, Company } from '../../types';

// Mock Mermaid component to avoid browser-only initialization
vi.mock('../../components/Mermaid', () => ({
  Mermaid: ({ chart }: { chart: string }) => <div data-testid="mermaid">{chart}</div>,
}));

// Provide hljs stub
beforeEach(() => {
  (window as any).hljs = { highlightElement: vi.fn() };
});

const mockDetails: QuestionDetails = {
  problem: {
    title: 'Two Sum',
    statement: 'Given an array of integers nums and a target...',
    inputOutput: [
      { input: 'nums=[2,7], target=9', output: '[0,1]', explanation: 'nums[0]+nums[1]=9' },
      { input: 'nums=[3,2,4], target=6', output: '[1,2]' },
    ],
  },
  edgeCases: ['Empty array returns []', 'Single element returns []'],
  approaches: {
    bruteForce: {
      logic: 'Check every pair\nCompare sums',
      timeComplexity: { notation: 'O(n²)', explanation: 'Two nested loops' },
      spaceComplexity: { notation: 'O(1)', explanation: 'No extra space' },
    },
    patternIdentification: 'Use a hash map to store complements',
    optimal: {
      logic: 'Use hash map\nSingle pass',
      timeComplexity: { notation: 'O(n)', explanation: 'Single pass' },
      spaceComplexity: { notation: 'O(n)', explanation: 'Hash map' },
    },
  },
  code: {
    javascript: 'function twoSum() { return []; }',
    python: 'def two_sum(): return []',
    java: 'public int[] twoSum() { return new int[0]; }',
  },
  followUps: [
    { question: 'What if the array is sorted?', answer: 'Use two pointers approach.' },
  ],
  diagram: {
    explanation: 'Flow of the algorithm',
    mermaidCode: 'flowchart TD\n  A[Start] --> B[End]',
  },
};

const question: Question = {
  id: 'q1',
  title: 'Two Sum',
  difficulty: Difficulty.Easy,
  company: Company.Google,
  problemStatement: 'Given an array...',
  details: mockDetails,
};

function renderView(overrides: Partial<React.ComponentProps<typeof QuestionView>> = {}) {
  const defaults = {
    question,
    isLoading: false,
    onRefine: vi.fn(),
    onSave: vi.fn(),
  };
  return render(<QuestionView {...defaults} {...overrides} />);
}

describe('QuestionView', () => {
  it('shows "Select a question" when question is null', () => {
    renderView({ question: null });
    expect(screen.getByText('Select a question')).toBeInTheDocument();
  });

  it('shows skeleton loader when isLoading and no details', () => {
    const questionWithoutDetails: Question = { ...question, details: undefined };
    renderView({ question: questionWithoutDetails, isLoading: true });
    expect(screen.getByText('Hold tight!')).toBeInTheDocument();
  });

  it('shows "Generating initial response..." when no details and not loading', () => {
    const questionWithoutDetails: Question = { ...question, details: undefined };
    renderView({ question: questionWithoutDetails });
    expect(screen.getByText('Generating initial response...')).toBeInTheDocument();
  });

  it('renders the problem title and statement', () => {
    renderView();
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText(/Given an array of integers nums/i)).toBeInTheDocument();
  });

  it('renders input/output examples', () => {
    renderView();
    expect(screen.getByText(/nums=\[2,7\], target=9/)).toBeInTheDocument();
    expect(screen.getByText(/\[0,1\]/)).toBeInTheDocument();
    expect(screen.getByText(/nums\[0\]\+nums\[1\]=9/)).toBeInTheDocument();
  });

  it('renders edge cases', () => {
    renderView();
    expect(screen.getByText('Empty array returns []')).toBeInTheDocument();
    expect(screen.getByText('Single element returns []')).toBeInTheDocument();
  });

  it('renders brute force and optimal approach sections', () => {
    renderView();
    expect(screen.getByText('Approach 1: Brute Force')).toBeInTheDocument();
    expect(screen.getByText('Approach 2: Optimal Solution')).toBeInTheDocument();
  });

  it('renders complexity notations', () => {
    renderView();
    const notations = screen.getAllByText('O(n²)');
    expect(notations.length).toBeGreaterThan(0);
    expect(screen.getAllByText('O(n)').length).toBeGreaterThan(0);
  });

  it('renders pattern identification', () => {
    renderView();
    expect(screen.getByText('Use a hash map to store complements')).toBeInTheDocument();
  });

  it('renders diagram section with mermaid component', () => {
    renderView();
    expect(screen.getByTestId('mermaid')).toBeInTheDocument();
    expect(screen.getByText('Flow of the algorithm')).toBeInTheDocument();
  });

  it('does not render diagram section when mermaidCode is empty', () => {
    const detailsNodiagram: QuestionDetails = {
      ...mockDetails,
      diagram: { explanation: '', mermaidCode: '' },
    };
    renderView({ question: { ...question, details: detailsNodiagram } });
    expect(screen.queryByTestId('mermaid')).not.toBeInTheDocument();
  });

  it('renders follow-up questions and answers', () => {
    renderView();
    expect(screen.getByText('What if the array is sorted?')).toBeInTheDocument();
    expect(screen.getByText('Use two pointers approach.')).toBeInTheDocument();
  });

  it('does not show refine panel when tempDetails is not set', () => {
    renderView();
    expect(screen.queryByPlaceholderText('Ask for changes or corrections...')).not.toBeInTheDocument();
  });

  it('shows refine panel when tempDetails is set', () => {
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp });
    expect(screen.getByPlaceholderText('Ask for changes or corrections...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refine' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Satisfied & Save/i })).toBeInTheDocument();
  });

  it('calls onRefine when Refine button is clicked', () => {
    const onRefine = vi.fn();
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp, onRefine });
    const input = screen.getByPlaceholderText('Ask for changes or corrections...');
    fireEvent.change(input, { target: { value: 'Add more examples' } });
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }));
    expect(onRefine).toHaveBeenCalledWith('Add more examples');
  });

  it('calls onRefine when Enter is pressed in refine input', () => {
    const onRefine = vi.fn();
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp, onRefine });
    const input = screen.getByPlaceholderText('Ask for changes or corrections...');
    fireEvent.change(input, { target: { value: 'Simplify explanation' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRefine).toHaveBeenCalledWith('Simplify explanation');
  });

  it('does not call onRefine on Enter when input is empty', () => {
    const onRefine = vi.fn();
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp, onRefine });
    const input = screen.getByPlaceholderText('Ask for changes or corrections...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRefine).not.toHaveBeenCalled();
  });

  it('calls onSave when "Satisfied & Save" is clicked', () => {
    const onSave = vi.fn();
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp, onSave });
    fireEvent.click(screen.getByRole('button', { name: /Satisfied & Save/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('disables Refine button when prompt is empty', () => {
    const questionWithTemp = { ...question, tempDetails: mockDetails };
    renderView({ question: questionWithTemp });
    expect(screen.getByRole('button', { name: 'Refine' })).toBeDisabled();
  });

  it('prefers tempDetails over details when both exist', () => {
    const differentDetails: QuestionDetails = {
      ...mockDetails,
      problem: { ...mockDetails.problem, title: 'Temp Version Title' },
    };
    const questionWithBoth = { ...question, details: mockDetails, tempDetails: differentDetails };
    renderView({ question: questionWithBoth });
    expect(screen.getByText('Temp Version Title')).toBeInTheDocument();
  });

  it('handles old-format (string) complexity gracefully', () => {
    const oldFormatDetails = {
      ...mockDetails,
      approaches: {
        ...mockDetails.approaches,
        bruteForce: {
          logic: 'Nested loops',
          timeComplexity: 'O(n²)' as any,
          spaceComplexity: 'O(1)' as any,
        },
      },
    };
    renderView({ question: { ...question, details: oldFormatDetails } });
    expect(screen.getAllByText('O(n²)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('O(1)').length).toBeGreaterThan(0);
  });
});
