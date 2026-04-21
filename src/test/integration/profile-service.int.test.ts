import { describe, it, expect } from 'vitest';
import { getStoredProfileById, updateProfileTable } from '../../services/profile/profile-records';

const TEST_USER_ID = process.env.TEST_PROFILE_USER_ID;
const integrationSuite = TEST_USER_ID ? describe : describe.skip;

integrationSuite('Profile Service (Integration)', () => {

  it('should fetch a real profile and its auth state', async () => {
    const profile = await getStoredProfileById(TEST_USER_ID!);
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(TEST_USER_ID);
    expect(profile?.fullName).toBeDefined();
  });

  it('should update profile and reflect changes', async () => {
    const profile = await getStoredProfileById(TEST_USER_ID!);
    const originalName = profile!.fullName;
    const testName = `Test ${Date.now()}`;

    // 1. Update
    const updated = await updateProfileTable(TEST_USER_ID!, {
      fullName: testName,
      phone: profile!.phone,
      city: profile!.city,
      avatarUrl: profile!.avatarUrl
    });
    expect(updated?.fullName).toBe(testName);

    // 2. Restore
    await updateProfileTable(TEST_USER_ID!, {
      fullName: originalName,
      phone: profile!.phone,
      city: profile!.city,
      avatarUrl: profile!.avatarUrl
    });
  });
});
