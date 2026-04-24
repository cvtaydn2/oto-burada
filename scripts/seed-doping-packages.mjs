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
    name: 'Ön Planda Göster',
    price: 49,
    duration_days: 7,
    type: 'featured',
    features: ['Aramada üst sıralar', 'Renkli arka plan', '7 gün boyunca öne çıkar'],
    is_active: true,
    sort_order: 1
  },
  {
    slug: 'acil',
    name: 'Acil İlan',
    price: 29,
    duration_days: 1,
    type: 'urgent',
    features: ['"Acil" rozeti', 'Özel sıralama', '24 saat boyunca acil etiketiyle gösterilir'],
    is_active: true,
    sort_order: 2
  },
  {
    slug: 'renkli_cerceve',
    name: 'Renkli Çerçeve',
    price: 19,
    duration_days: 7,
    type: 'highlighted',
    features: ['Dikkat çekici kenarlık', 'Turuncu çerçeve ile öne çıkar', '7 gün boyunca aktif'],
    is_active: true,
    sort_order: 3
  },
  {
    slug: 'galeri',
    name: 'Galeri Highlight',
    price: 39,
    duration_days: 7,
    type: 'gallery',
    features: ['Anasayfa galeride gösterim', 'Carousel\'de öne çıkar', '7 gün boyunca vitrin alanında'],
    is_active: true,
    sort_order: 4
  },
  {
    slug: 'bump',
    name: 'Yenile (Bump)',
    price: 15,
    duration_days: 0,
    type: 'bump',
    features: ['İlanı en üste taşı', 'Yayın tarihini günceller', 'Anında etki'],
    is_active: true,
    sort_order: 5
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
