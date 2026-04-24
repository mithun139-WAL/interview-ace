// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewQuestionModal } from '../../components/NewQuestionModal';
import { Difficulty, Company } from '../../types';

function renderModal(overrides: Partial<React.ComponentProps<typeof NewQuestionModal>> = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };
  return render(<NewQuestionModal {...defaults} {...overrides} />);
}

describe('NewQuestionModal', () => {
  it('renders the modal when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Add a New Question')).toBeInTheDocument();
    expect(screen.getByLabelText('Problem Statement')).toBeInTheDocument();
    expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Tag')).toBeInTheDocument();
  });

  it('returns null when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('submit button is disabled when problem statement is empty', () => {
    renderModal();
    const submitBtn = screen.getByRole('button', { name: /Generate with AI/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button is enabled when problem statement has content', () => {
    renderModal();
    const textarea = screen.getByLabelText('Problem Statement');
    fireEvent.change(textarea, { target: { value: 'Given an array...' } });
    const submitBtn = screen.getByRole('button', { name: /Generate with AI/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with trimmed problem statement, difficulty, and company on submit', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText('Problem Statement'), {
      target: { value: '  Two Sum problem  ' },
    });
    fireEvent.change(screen.getByLabelText('Difficulty'), {
      target: { value: Difficulty.Hard },
    });
    fireEvent.change(screen.getByLabelText('Company Tag'), {
      target: { value: Company.Meta },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate with AI/i }));
    expect(onSubmit).toHaveBeenCalledWith('Two Sum problem', Difficulty.Hard, Company.Meta);
  });

  it('does not call onSubmit when problem statement is only whitespace', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    fireEvent.change(screen.getByLabelText('Problem Statement'), {
      target: { value: '   ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Generate with AI/i }).closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Generating..." text and disables buttons when isLoading', () => {
    renderModal({ isLoading: true });
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('populates difficulty dropdown with all difficulty values', () => {
    renderModal();
    const select = screen.getByLabelText('Difficulty');
    Object.values(Difficulty).forEach(d => {
      expect(select).toContainElement(screen.getByRole('option', { name: d }));
    });
  });

  it('populates company dropdown with all company values', () => {
    renderModal();
    const select = screen.getByLabelText('Company Tag');
    Object.values(Company).forEach(c => {
      expect(select).toContainElement(screen.getByRole('option', { name: c }));
    });
  });

  it('has Medium difficulty selected by default', () => {
    renderModal();
    expect(screen.getByLabelText('Difficulty')).toHaveValue(Difficulty.Medium);
  });

  it('has General company selected by default', () => {
    renderModal();
    expect(screen.getByLabelText('Company Tag')).toHaveValue(Company.General);
  });
});
