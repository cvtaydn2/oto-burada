import { describe, it, expect } from 'vitest';
import { lookupVehicleByPlate } from '../../services/listings/plate-lookup';
import { createSupabaseAdminClient } from '../../lib/supabase/admin';

describe('Plate Lookup Service (Integration)', () => {
  const admin = createSupabaseAdminClient();

  it('should return live database data for a valid plate', async () => {
    const result = await lookupVehicleByPlate('34ABC123', admin);
    
    expect(result).not.toBeNull();
    expect(result?.brand).toBeDefined();
    expect(result?.model).toBeDefined();
    
    // Logic check: year should be deterministic
    expect(result?.year).toBeGreaterThanOrEqual(2020);
    expect(result?.year).toBeLessThanOrEqual(2024);
  });

  it('should return null for invalid plate formats', async () => {
    const result = await lookupVehicleByPlate('INVALID');
    expect(result).toBeNull();
  });
});
