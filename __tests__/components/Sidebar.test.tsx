// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../../components/Sidebar';
import { Difficulty, Company } from '../../types';
import type { Question } from '../../types';

const questions: Question[] = [
  { id: '1', title: 'Two Sum', difficulty: Difficulty.Easy, company: Company.Google, problemStatement: 'p1' },
  { id: '2', title: 'Longest Substring', difficulty: Difficulty.Medium, company: Company.Google, problemStatement: 'p2' },
  { id: '3', title: 'Median of Arrays', difficulty: Difficulty.Hard, company: Company.Meta, problemStatement: 'p3' },
  { id: '4', title: 'Valid Parentheses', difficulty: Difficulty.Easy, company: Company.Amazon, problemStatement: 'p4' },
];

function renderSidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const defaults = {
    questions,
    selectedQuestionId: null,
    onSelectQuestion: vi.fn(),
    onAddNew: vi.fn(),
    isOpen: true,
    onClose: vi.fn(),
    isLoading: false,
  };
  return render(<Sidebar {...defaults} {...overrides} />);
}

describe('Sidebar', () => {
  it('renders all question titles', () => {
    renderSidebar();
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Longest Substring')).toBeInTheDocument();
    expect(screen.getByText('Median of Arrays')).toBeInTheDocument();
    expect(screen.getByText('Valid Parentheses')).toBeInTheDocument();
  });

  it('groups questions by company', () => {
    renderSidebar();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('filters questions by search term', () => {
    renderSidebar();
    const search = screen.getByPlaceholderText('Search questions...');
    fireEvent.change(search, { target: { value: 'two' } });
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.queryByText('Longest Substring')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    renderSidebar();
    const search = screen.getByPlaceholderText('Search questions...');
    fireEvent.change(search, { target: { value: 'MEDIAN' } });
    expect(screen.getByText('Median of Arrays')).toBeInTheDocument();
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument();
  });

  it('filters questions by difficulty', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Easy' }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Valid Parentheses')).toBeInTheDocument();
    expect(screen.queryByText('Longest Substring')).not.toBeInTheDocument();
    expect(screen.queryByText('Median of Arrays')).not.toBeInTheDocument();
  });

  it('shows all questions when "All" filter is selected', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Hard' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Longest Substring')).toBeInTheDocument();
    expect(screen.getByText('Median of Arrays')).toBeInTheDocument();
  });

  it('combines search and difficulty filters', () => {
    renderSidebar();
    const search = screen.getByPlaceholderText('Search questions...');
    fireEvent.change(search, { target: { value: 'sum' } });
    fireEvent.click(screen.getByRole('button', { name: 'Easy' }));
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.queryByText('Valid Parentheses')).not.toBeInTheDocument();
  });

  it('shows "No questions found" when filters return nothing', () => {
    renderSidebar();
    const search = screen.getByPlaceholderText('Search questions...');
    fireEvent.change(search, { target: { value: 'xyznotfound' } });
    expect(screen.getByText('No questions found')).toBeInTheDocument();
  });

  it('calls onSelectQuestion with the correct id when a question is clicked', () => {
    const onSelectQuestion = vi.fn();
    renderSidebar({ onSelectQuestion });
    fireEvent.click(screen.getByText('Two Sum'));
    expect(onSelectQuestion).toHaveBeenCalledWith('1');
  });

  it('does not call onSelectQuestion when isLoading', () => {
    const onSelectQuestion = vi.fn();
    renderSidebar({ onSelectQuestion, isLoading: true });
    fireEvent.click(screen.getByText('Two Sum'));
    expect(onSelectQuestion).not.toHaveBeenCalled();
  });

  it('calls onAddNew when the Add New Question button is clicked', () => {
    const onAddNew = vi.fn();
    renderSidebar({ onAddNew });
    fireEvent.click(screen.getByRole('button', { name: /Add New Question/i }));
    expect(onAddNew).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    renderSidebar({ onClose });
    const closeButton = screen.getByRole('button', { name: '' }).closest('button');
    // Find the MD-hidden close button (XIcon)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(btn => btn.classList.contains('md:hidden'));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('highlights the selected question', () => {
    renderSidebar({ selectedQuestionId: '1' });
    const link = screen.getByText('Two Sum').closest('a');
    expect(link).toHaveClass('bg-indigo-100');
  });

  it('shows difficulty badges for questions', () => {
    renderSidebar();
    // Two questions are Easy (Two Sum + Valid Parentheses), so there are multiple badge spans
    const easyBadges = screen.getAllByText('Easy', { selector: 'span' });
    expect(easyBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Medium', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Hard', { selector: 'span' })).toBeInTheDocument();
  });

  it('renders correctly when questions list is empty', () => {
    renderSidebar({ questions: [] });
    expect(screen.getByText('No questions found')).toBeInTheDocument();
  });
});
