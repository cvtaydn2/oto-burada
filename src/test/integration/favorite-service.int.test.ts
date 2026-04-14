import { describe, it, expect } from 'vitest';
import { addDatabaseFavorite, getDatabaseFavoriteIds, removeDatabaseFavorite } from '../../services/favorites/favorite-records';

describe('Favorite Service (Integration)', () => {
  const TEST_USER_ID = 'fde3c732-6bdc-4eb4-9c4c-471040b94e7d';
  const TEST_LISTING_ID = '2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1';

  it('should toggle favorites and list them', async () => {
    // 1. Add
    const idsAfterAdd = await addDatabaseFavorite(TEST_USER_ID, TEST_LISTING_ID);
    expect(idsAfterAdd).toContain(TEST_LISTING_ID);

    // 2. List
    const ids = await getDatabaseFavoriteIds(TEST_USER_ID);
    expect(ids).toContain(TEST_LISTING_ID);

    // 3. Remove
    const idsAfterRemove = await removeDatabaseFavorite(TEST_USER_ID, TEST_LISTING_ID);
    expect(idsAfterRemove).not.toContain(TEST_LISTING_ID);
  });
});
