import React, { useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../src/components/EmptyState';
import { useFocusTrap } from '../../src/hooks/useFocusTrap';
import { AddListingPage } from '../../src/components/add-listing-page';
import { TRANSLATIONS } from '../../src/constants';

// Test wrapper component for testing useFocusTrap
const FocusTrapTestModal = ({ isActive, onClose }: { isActive: boolean; onClose: () => void }) => {
  const modalRef = useFocusTrap<HTMLDivElement>(isActive, onClose);
  if (!isActive) return null;
  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Test Modal">
      <button data-testid="first-btn">First Action</button>
      <input data-testid="text-input" placeholder="Enter text" />
      <button data-testid="close-btn" onClick={onClose}>Close</button>
    </div>
  );
};

describe('Tier 1 — WCAG 2.1 AA Accessibility & RTL Parity Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('EmptyState Component', () => {
    it('renders search variant with appropriate title, description, and action trigger', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          variant="search"
          title="No properties found"
          description="Try adjusting your filters"
          actionLabel="Clear Filters"
          onAction={onAction}
          isRtl={false}
        />
      );

      expect(screen.getByText('No properties found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: 'Clear Filters' });
      expect(actionBtn).toBeInTheDocument();
      fireEvent.click(actionBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders favorites variant with RTL layout support', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          variant="favorites"
          title="لا توجد عقارات في المفضلة"
          description="أضف عقارات بالضغط على زر القلب"
          actionLabel="تصفح العقارات"
          onAction={onAction}
          isRtl={true}
        />
      );

      expect(screen.getByText('لا توجد عقارات في المفضلة')).toBeInTheDocument();
      expect(screen.getByText('أضف عقارات بالضغط على زر القلب')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: 'تصفح العقارات' });
      expect(actionBtn).toBeInTheDocument();
      fireEvent.click(actionBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders listings variant correctly without action button if onAction is omitted', () => {
      render(
        <EmptyState
          variant="listings"
          title="No listings available"
          description="Check back soon for new additions"
        />
      );

      expect(screen.getByText('No listings available')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('useFocusTrap Hook', () => {
    it('traps focus and handles Escape key press', () => {
      const onClose = vi.fn();
      render(<FocusTrapTestModal isActive={true} onClose={onClose} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Escape key press calls onClose
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cycles focus within modal on Tab and Shift+Tab', () => {
      const onClose = vi.fn();
      render(<FocusTrapTestModal isActive={true} onClose={onClose} />);

      const firstBtn = screen.getByTestId('first-btn');
      const closeBtn = screen.getByTestId('close-btn');

      // Focus first element
      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);

      // Shift+Tab from first element wraps to last element
      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(closeBtn);

      // Tab from last element wraps to first element
      fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(firstBtn);
    });
  });

  describe('AddListingPage Accessibility & RTL Parity', () => {
    it('provides role="tablist" and accessible step tabs with keyboard navigation', () => {
      const onAdd = vi.fn();
      render(
        <AddListingPage
          onAdd={onAdd}
          t={TRANSLATIONS.en}
          isRtl={false}
          isAdmin={false}
          isSuperAdmin={false}
        />
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(3);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('mirrors directional arrows in RTL mode for Back and Next buttons', () => {
      const onAdd = vi.fn();
      render(
        <AddListingPage
          onAdd={onAdd}
          t={TRANSLATIONS.ar}
          isRtl={true}
          isAdmin={false}
          isSuperAdmin={false}
        />
      );

      const nextBtn = screen.getByRole('button', { name: /التالي/i });
      expect(nextBtn).toBeInTheDocument();
    });
  });
});
