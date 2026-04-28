const { fetchLiveMarketplaceReferenceData } = require('./src/services/reference/reference-records');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
  try {
    const data = await fetchLiveMarketplaceReferenceData();
    console.log('Data fetched successfully:', !!data);
    console.log('Cities count:', data.cities.length);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
