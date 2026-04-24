import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const DOPING_PACKAGES = [
  {
    slug: 'on_planda',
    name: 'Ön Planda',
    price: 49,
    duration_days: 7,
    type: 'featured',
    features: ['İlan listenin en başında görünür', 'Mavi çerçeve ile dikkat çeker'],
    is_active: true,
    sort_order: 1
  },
  {
    slug: 'acil',
    name: 'Acil Acil',
    price: 29,
    duration_days: 3,
    type: 'urgent',
    features: ['Acil etiketi eklenir', 'Sarı renkli arkaplan'],
    is_active: true,
    sort_order: 2
  },
  {
    slug: 'bump',
    name: 'Güncel Tut',
    price: 19,
    duration_days: 0,
    type: 'bump',
    features: ['İlan yayın tarihini günceller', 'Listenin en üstüne taşır'],
    is_active: true,
    sort_order: 3
  }
];

async function seed() {
  console.log('Seeding doping packages...');
  
  for (const pkg of DOPING_PACKAGES) {
    const { error } = await supabase
      .from('doping_packages')
      .upsert(pkg, { onConflict: 'slug' });
      
    if (error) {
      console.error(`Error seeding ${pkg.slug}:`, error.message);
    } else {
      console.log(`Seeded: ${pkg.slug}`);
    }
  }
  
  console.log('Done!');
}

seed();
