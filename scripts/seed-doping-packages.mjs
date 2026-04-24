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
    slug: 'kucuk_fotograf',
    name: 'Küçük Fotoğraf',
    price: 39,
    duration_days: 7,
    type: 'small_photo',
    features: ['Liste görünümünde fotoğrafı öne çıkar', 'Daha güçlü ilk izlenim', '7 gün aktif'],
    is_active: true,
    sort_order: 1,
  },
  {
    slug: 'acil_acil',
    name: 'Acil Acil',
    price: 182,
    duration_days: 7,
    type: 'urgent',
    features: ['"Acil" rozeti', 'Acil ilan vurgusu', '7 gün boyunca aktif'],
    is_active: true,
    sort_order: 2,
  },
  {
    slug: 'anasayfa_vitrini',
    name: 'Anasayfa Vitrini',
    price: 760,
    duration_days: 7,
    type: 'homepage_showcase',
    features: ['Anasayfa vitrin alanında görünür', 'En yüksek görünürlük', '7 gün aktif'],
    is_active: true,
    sort_order: 3,
  },
  {
    slug: 'kategori_vitrini',
    name: 'Kategori Vitrini',
    price: 230,
    duration_days: 7,
    type: 'category_showcase',
    features: ['Seçili araç kategorisinde öne çıkar', 'İlgili alıcıya daha görünür', '7 gün aktif'],
    is_active: true,
    sort_order: 4,
  },
  {
    slug: 'ust_siradayim',
    name: 'Üst Sıradayım',
    price: 660,
    duration_days: 7,
    type: 'top_rank',
    features: ['Arama sonuçlarında üst sıra önceliği', 'Liste görünürlüğünü artırır', '7 gün aktif'],
    is_active: true,
    sort_order: 5,
  },
  {
    slug: 'detayli_arama_vitrini',
    name: 'Detaylı Arama Vitrini',
    price: 90,
    duration_days: 7,
    type: 'detailed_search_showcase',
    features: ['Detaylı filtre sonuçlarında öne çıkar', 'Niyetli alıcıya görünür', '7 gün aktif'],
    is_active: true,
    sort_order: 6,
  },
  {
    slug: 'kalin_yazi_renkli_cerceve',
    name: 'Kalın Yazı & Renkli Çerçeve',
    price: 61,
    duration_days: 7,
    type: 'bold_frame',
    features: ['Kalın başlık', 'Renkli çerçeve', '7 gün boyunca dikkat çeker'],
    is_active: true,
    sort_order: 7,
  },
  {
    slug: 'guncelim',
    name: 'Güncelim',
    price: 88,
    duration_days: 0,
    type: 'bump',
    features: ['İlan tarihini günceller', 'Tek kullanım', 'Aynı ilan için 24 saat sonra tekrar alınabilir'],
    is_active: true,
    sort_order: 8,
  },
];

async function seed() {
  console.log('Seeding doping packages...');

  for (const pkg of DOPING_PACKAGES) {
    const { error } = await supabase.from('doping_packages').upsert(pkg, { onConflict: 'slug' });

    if (error) {
      console.error(`Error seeding ${pkg.slug}:`, error.message);
    } else {
      console.log(`Seeded: ${pkg.slug}`);
    }
  }

  console.log('Done!');
}

seed();
