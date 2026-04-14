import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildReport, parseStoredReports, serializeStoredReports, replaceStoredReport } from '../report-submissions';
import { Report } from '@/types';

describe('report-submissions logic', () => {
  const mockReporterId = 'reporter-123';
  const mockInput = {
    listingId: 'listing-456',
    reason: 'fake_listing' as const,
    description: 'Fraudulent listing info',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildReport', () => {
    it('should create a new report with correct fields', () => {
      const report = buildReport(mockInput, mockReporterId);
      expect(report.listingId).toBe(mockInput.listingId);
      expect(report.reporterId).toBe(mockReporterId);
      expect(report.reason).toBe(mockInput.reason);
      expect(report.status).toBe('open');
      expect(report.id).toMatch(/^report-/);
    });

    it('should update an existing report', () => {
      const existingReport: Report = {
        id: 'report-1',
        listingId: 'listing-456',
        reporterId: mockReporterId,
        reason: 'other',
        status: 'open',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      };
      const updated = buildReport(mockInput, mockReporterId, existingReport);
      expect(updated.id).toBe('report-1');
      expect(updated.reason).toBe(mockInput.reason);
      expect(updated.createdAt).toBe('2023-01-01');
    });
  });

  describe('replaceStoredReport', () => {
    it('should add a new report to the list', () => {
      const existing: Report[] = [];
      const next: Report = { id: '1' } as any;
      const result = replaceStoredReport(existing, next);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should update an existing report in the list', () => {
      const existing: Report[] = [{ id: '1', reason: 'old' } as any];
      const next: Report = { id: '1', reason: 'new' } as any;
      const result = replaceStoredReport(existing, next);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('new');
    });
  });

  describe('serialization', () => {
    it('should round-trip generic reports', () => {
      const reports: Report[] = [
        { id: '1', listingId: 'l1', reporterId: 'r1', reason: 'other', status: 'open', createdAt: '2023', updatedAt: '2023' }
      ];
      const serialized = serializeStoredReports(reports);
      const parsed = parseStoredReports(serialized);
      expect(parsed).toEqual(reports);
    });

    it('should return empty array for invalid json', () => {
      expect(parseStoredReports('invalid')).toEqual([]);
    });
  });
});
