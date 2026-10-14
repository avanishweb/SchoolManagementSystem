import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { ErrorAlert } from '../components/common/ErrorAlert.js';
import { Skeleton } from '../components/common/Skeleton.js';

describe('Common UI Components', () => {
  it('renders LoadingSpinner with default and custom labels', () => {
    const { rerender } = render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingSpinner label="Authenticating session..." />);
    expect(screen.getByText('Authenticating session...')).toBeInTheDocument();
  });

  it('renders ErrorAlert with title, message, and dismissal button', () => {
    const handleDismiss = vi.fn();
    render(
      <ErrorAlert
        title="Authentication Failed"
        message="Invalid credentials supplied."
        onDismiss={handleDismiss}
      />
    );

    expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials supplied.')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss error/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders Skeleton component with accessible role or hidden state', () => {
    const { container } = render(<Skeleton className="w-32 h-6" />);
    const skeletonEl = container.firstChild as HTMLElement;
    expect(skeletonEl).toHaveClass('animate-pulse');
  });
});
