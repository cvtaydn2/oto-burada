import { describe, it, expect } from 'vitest';
import { getLiveMarketplaceReferenceData } from '../../services/reference/live-reference-data';

describe('Reference Service (Integration)', () => {
  it('should fetch live catalog data', async () => {
    const data = await getLiveMarketplaceReferenceData();
    
    expect(data.brands).toBeDefined();
    expect(data.brands.length).toBeGreaterThan(0);
    
    expect(data.cities).toBeDefined();
    expect(data.cities.length).toBeGreaterThan(0);

    expect(data.searchSuggestions).toBeDefined();
  }, 20000);
});
