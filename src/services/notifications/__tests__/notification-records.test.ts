import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDatabaseNotification, getStoredNotificationsByUser, markDatabaseNotificationRead } from '../notification-records';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin');

type NotificationQueryResult = {
  data:
    | Array<{
        id: string;
        user_id: string;
        type: 'system';
        title: string;
        message: string;
        read: boolean;
        created_at: string;
        updated_at: string;
      }>
    | {
        id: string;
        user_id: string;
        type: 'system';
        title: string;
        message: string;
        read: boolean;
        created_at: string;
        updated_at: string;
      }
    | null;
  error: unknown;
};

describe('notification-records service', () => {
  const mockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    returns: vi.fn(),
    then: vi.fn(),
  };
  const mockAdminClient = {
    from: vi.fn(() => mockChain),
  };

  // Shared state to control what .then() resolves to
  let nextResolveValue: NotificationQueryResult = { data: null, error: null };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockAdminClient as never);

    nextResolveValue = { data: null, error: null };

    mockChain.select = vi.fn().mockReturnValue(mockChain);
    mockChain.insert = vi.fn().mockReturnValue(mockChain);
    mockChain.update = vi.fn().mockReturnValue(mockChain);
    mockChain.delete = vi.fn().mockReturnValue(mockChain);
    mockChain.eq = vi.fn().mockReturnValue(mockChain);
    mockChain.order = vi.fn().mockReturnValue(mockChain);
    mockChain.single = vi.fn().mockImplementation(() => Promise.resolve(nextResolveValue));
    mockChain.returns = vi.fn().mockImplementation(() => Promise.resolve(nextResolveValue));
    
    // Proper thenable implementation
    mockChain.then = vi.fn().mockImplementation((onFulfilled: (value: NotificationQueryResult) => unknown) => {
      return Promise.resolve(nextResolveValue).then(onFulfilled);
    });
  });

  describe('createDatabaseNotification', () => {
    it('should create and map a notification', async () => {
      nextResolveValue = {
        data: {
          id: 'n1',
          user_id: 'u1',
          type: 'system',
          title: 'Test',
          message: 'Msg',
          read: false,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        },
        error: null
      };

      const result = await createDatabaseNotification({
        userId: 'u1',
        type: 'system',
        title: 'Test',
        message: 'Msg'
      });

      expect(result?.id).toBe('n1');
      expect(mockChain.insert).toHaveBeenCalled();
    });
  });

  describe('getStoredNotificationsByUser', () => {
    it('should fetch notifications for a user', async () => {
      nextResolveValue = {
        data: [{ 
          id: 'n1', 
          user_id: 'u1', 
          type: 'system', 
          title: 'T', 
          message: 'M', 
          read: false,
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }],
        error: null
      };

      const result = await getStoredNotificationsByUser('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('markDatabaseNotificationRead', () => {
    it('should mark as read and return updated notification', async () => {
      // First call is update (returns null error)
      nextResolveValue = { data: null, error: null };
      
      // Override for the internal getDatabaseNotifications call
      mockChain.returns.mockResolvedValueOnce({
        data: [{ 
          id: 'n1', 
          user_id: 'u1', 
          read: true, 
          type: 'system', 
          title: 'T', 
          message: 'M',
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }],
        error: null
      });

      const result = await markDatabaseNotificationRead('u1', 'n1');
      expect(result?.read).toBe(true);
      expect(mockChain.update).toHaveBeenCalled();
    });
  });
});
