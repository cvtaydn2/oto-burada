import { describe, it, expect } from 'vitest';
import { createDatabaseNotification, getStoredNotificationsByUser, markDatabaseNotificationRead } from '../../services/notifications/notification-records';

describe('Notification Service (Integration)', () => {
  const TEST_USER_ID = 'fde3c732-6bdc-4eb4-9c4c-471040b94e7d'; // Existing user

  it('should create, fetch and read notifications', async () => {
    // 1. Create
    const title = `Test ${Date.now()}`;
    const notification = await createDatabaseNotification({
      userId: TEST_USER_ID,
      type: 'system',
      title: title,
      message: 'Integration check'
    });
    
    expect(notification).not.toBeNull();
    expect(notification?.title).toBe(title);

    // 2. Fetch
    const list = await getStoredNotificationsByUser(TEST_USER_ID);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some(n => n.title === title)).toBe(true);

    // 3. Mark Read
    expect(notification?.id).toBeDefined();
    if (!notification?.id) return;

    const updated = await markDatabaseNotificationRead(TEST_USER_ID, notification.id);
    expect(updated?.read).toBe(true);
  });
});
