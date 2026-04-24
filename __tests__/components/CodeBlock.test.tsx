// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeBlock } from '../../components/CodeBlock';

const code = {
  javascript: 'function twoSum(nums, target) { return []; }',
  python: 'def two_sum(nums, target):\n    return []',
  java: 'public int[] twoSum(int[] nums, int target) { return new int[0]; }',
};

beforeEach(() => {
  // Provide a minimal hljs stub on window
  (window as any).hljs = {
    highlightElement: vi.fn(),
  };
});

describe('CodeBlock', () => {
  it('renders the JavaScript tab as active by default', () => {
    render(<CodeBlock code={code} />);
    const jsTab = screen.getByRole('button', { name: 'JavaScript' });
    expect(jsTab).toHaveClass('border-primary');
  });

  it('displays JavaScript code by default', () => {
    render(<CodeBlock code={code} />);
    expect(screen.getByText(code.javascript)).toBeInTheDocument();
  });

  it('switches to Python tab when clicked', () => {
    render(<CodeBlock code={code} />);
    fireEvent.click(screen.getByRole('button', { name: 'Python' }));
    // Python code has newlines so use a custom text matcher
    const codeEl = document.querySelector('code.language-python');
    expect(codeEl).not.toBeNull();
    expect(codeEl!.textContent).toContain('def two_sum');
  });

  it('switches to Java tab when clicked', () => {
    render(<CodeBlock code={code} />);
    fireEvent.click(screen.getByRole('button', { name: 'Java' }));
    expect(screen.getByText(code.java)).toBeInTheDocument();
  });

  it('marks the active tab with border-primary class', () => {
    render(<CodeBlock code={code} />);
    fireEvent.click(screen.getByRole('button', { name: 'Python' }));
    expect(screen.getByRole('button', { name: 'Python' })).toHaveClass('border-primary');
    expect(screen.getByRole('button', { name: 'JavaScript' })).not.toHaveClass('border-primary');
  });

  it('calls hljs.highlightElement when language changes', () => {
    render(<CodeBlock code={code} />);
    fireEvent.click(screen.getByRole('button', { name: 'Python' }));
    expect((window as any).hljs.highlightElement).toHaveBeenCalled();
  });

  it('shows Copy button by default', () => {
    render(<CodeBlock code={code} />);
    expect(screen.getByRole('button', { name: /Copy code to clipboard/i })).toBeInTheDocument();
  });

  it('shows "Copied!" text and then reverts after copy', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(<CodeBlock code={code} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Copy code to clipboard/i }));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(code.javascript);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders all three language tabs', () => {
    render(<CodeBlock code={code} />);
    expect(screen.getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument();
  });
});
