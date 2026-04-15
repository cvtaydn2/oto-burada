/**
 * Bug Condition Exploration Test — Bug 4: Right-column fields not visible
 *
 * These tests MUST FAIL on unfixed code.
 * Failure confirms the bug exists.
 * DO NOT fix the code when these tests fail.
 *
 * Validates: Requirements 1.7, 1.8
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { ListingCreateFormValues } from '@/types/domain';
import { ExpertInspectionEditor } from '../expert-inspection-editor';

// Wrapper that provides a form with hasInspection = true
function TestWrapper() {
  const form = useForm<ListingCreateFormValues>({
    defaultValues: {
      expertInspection: {
        hasInspection: true,
        damageRecord: 'bilinmiyor',
        bodyPaint: 'bilinmiyor',
        engine: 'bilinmiyor',
        transmission: 'bilinmiyor',
        suspension: 'bilinmiyor',
        brakes: 'bilinmiyor',
        electrical: 'bilinmiyor',
        interior: 'bilinmiyor',
        tires: 'bilinmiyor',
        acHeating: 'bilinmiyor',
      },
    },
  });
  return <ExpertInspectionEditor form={form} />;
}

describe('Bug 4 — Expert inspection right-column fields not visible (EXPECTED TO FAIL on unfixed code)', () => {
  /**
   * Bug condition: grid uses sm:grid-cols-2 but container overflow or breakpoint
   * causes right-column fields to be hidden/invisible.
   *
   * Right-column fields (indices 1,3,5,7,9 in INSPECTION_FIELDS):
   *   - Kaporta & Boya Durumu
   *   - Şanzıman / Vites Geçişleri
   *   - Fren Sistemi
   *   - İç Kondisyon / Döşeme
   *   - Klima / Isıtma Sistemi
   *
   * Counterexample: getByText("Şanzıman / Vites Geçişleri") exists in DOM
   * but getBoundingClientRect().width === 0 (overflow hidden)
   */
  it('should render all 10 INSPECTION_FIELDS when hasInspection is true', () => {
    render(<TestWrapper />);

    // All 10 fields must be in the DOM
    expect(screen.getByText('Hasar Kaydı Sorgusu')).toBeInTheDocument();
    expect(screen.getByText('Kaporta & Boya Durumu')).toBeInTheDocument();
    expect(screen.getByText('Motor Performansı')).toBeInTheDocument();
    expect(screen.getByText('Şanzıman / Vites Geçişleri')).toBeInTheDocument();
    expect(screen.getByText('Yol Tutuş / Süspansiyon')).toBeInTheDocument();
    expect(screen.getByText('Fren Sistemi')).toBeInTheDocument();
    expect(screen.getByText('Elektronik Aksallar')).toBeInTheDocument();
    expect(screen.getByText('İç Kondisyon / Döşeme')).toBeInTheDocument();
    expect(screen.getByText('Lastik Durumu')).toBeInTheDocument();
    expect(screen.getByText('Klima / Isıtma Sistemi')).toBeInTheDocument();
  });

  it('grid container should use md:grid-cols-2 breakpoint (not sm:grid-cols-2)', () => {
    render(<TestWrapper />);

    // The bug: grid uses sm:grid-cols-2 which doesn't trigger at the container width.
    // The fix: use md:grid-cols-2.
    // We assert the grid has md:grid-cols-2 class — this FAILS on unfixed code (which has sm:grid-cols-2).
    const firstField = screen.getByText('Hasar Kaydı Sorgusu');
    const gridContainer = firstField.closest('.grid');
    expect(gridContainer).not.toBeNull();

    // On unfixed code: className contains "sm:grid-cols-2" → test FAILS
    // On fixed code: className contains "md:grid-cols-2" → test PASSES
    expect(gridContainer?.className).toContain('md:grid-cols-2');
  });
});
