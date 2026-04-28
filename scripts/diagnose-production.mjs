#!/usr/bin/env node

/**
 * Production Diagnostic Script
 * 
 * Bu script production ortamında yaşanan sorunları tespit etmek için kullanılır.
 * Özellikle ücretsiz tier'larda karşılaşılan konfigürasyon ve limit sorunlarını kontrol eder.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CHECKS = {
  ENV_VARS: '1. Environment Variables',
  SUPABASE_CONNECTION: '2. Supabase Connection',
  AUTH_CONFIG: '3. Auth Configuration',
  DATABASE_TABLES: '4. Database Tables',
  RLS_POLICIES: '5. RLS Policies',
  STORAGE_BUCKETS: '6. Storage Buckets',
  EMAIL_SETTINGS: '7. Email Settings',
};

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function pass(check, message) {
  results.passed.push({ check, message });
  log('✅', `${check}: ${message}`);
}

function fail(check, message, solution) {
  results.failed.push({ check, message, solution });
  log('❌', `${check}: ${message}`);
  if (solution) {
    log('💡', `   Çözüm: ${solution}`);
  }
}

function warn(check, message) {
  results.warnings.push({ check, message });
  log('⚠️', `${check}: ${message}`);
}

async function checkEnvironmentVariables() {
  const check = CHECKS.ENV_VARS;
  log('🔍', `${check} kontrol ediliyor...`);

  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const optional = {
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'TURNSTILE_SECRET_KEY': process.env.TURNSTILE_SECRET_KEY,
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY': process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'UPSTASH_REDIS_REST_URL': process.env.UPSTASH_REDIS_REST_URL,
  };

  let allRequiredPresent = true;

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      fail(check, `${key} tanımlı değil`, 'Vercel Dashboard > Settings > Environment Variables');
      allRequiredPresent = false;
    } else if (value.includes('your-') || value.includes('example')) {
      fail(check, `${key} placeholder değer içeriyor`, 'Gerçek değerlerle değiştirin');
      allRequiredPresent = false;
    }
  }

  if (allRequiredPresent) {
    pass(check, 'Tüm zorunlu environment variables tanımlı');
  }

  // Check optional
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      warn(check, `${key} tanımlı değil (opsiyonel)`);
    }
  }

  return allRequiredPresent;
}

async function checkSupabaseConnection() {
  const check = CHECKS.SUPABASE_CONNECTION;
  log('🔍', `${check} kontrol ediliyor...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    fail(check, 'Supabase credentials eksik', 'Environment variables kontrol edin');
    return false;
  }

  try {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      fail(check, `Supabase bağlantı hatası: ${error.message}`, 'Supabase Dashboard > Settings > API kontrol edin');
      return false;
    }

    pass(check, 'Supabase bağlantısı başarılı');
    return true;
  } catch (error) {
    fail(check, `Bağlantı hatası: ${error.message}`, 'Network veya firewall ayarlarını kontrol edin');
    return false;
  }
}

async function checkAuthConfiguration() {
  const check = CHECKS.AUTH_CONFIG;
  log('🔍', `${check} kontrol ediliyor...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    fail(check, 'Credentials eksik', null);
    return false;
  }

  try {
    const supabase = createClient(url, anonKey);
    
    // Test signup (will fail but we can see the error)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456!',
    });

    if (error) {
      // Check specific error types
      if (error.message.includes('Email signups are disabled')) {
        fail(
          check,
          'Email kayıt kapalı',
          'Supabase Dashboard > Authentication > Providers > Email > Enable email provider'
        );
        return false;
      } else if (error.message.includes('Email rate limit exceeded')) {
        warn(check, 'Email rate limit aşıldı (ücretsiz tier limiti)');
        return true; // Not a config issue
      } else if (error.message.includes('confirm your email')) {
        pass(check, 'Auth yapılandırması çalışıyor (email confirmation gerekli)');
        return true;
      } else {
        warn(check, `Auth test uyarısı: ${error.message}`);
        return true; // Might be OK
      }
    }

    if (data.user) {
      pass(check, 'Auth yapılandırması çalışıyor');
      return true;
    }

    warn(check, 'Auth durumu belirsiz');
    return true;
  } catch (error) {
    fail(check, `Auth test hatası: ${error.message}`, null);
    return false;
  }
}

async function checkDatabaseTables() {
  const check = CHECKS.DATABASE_TABLES;
  log('🔍', `${check} kontrol ediliyor...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    fail(check, 'Admin credentials eksik', null);
    return false;
  }

  try {
    const supabase = createClient(url, serviceKey);
    
    const requiredTables = ['profiles', 'listings', 'favorites', 'reports'];
    let allTablesExist = true;

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      
      if (error) {
        fail(check, `Tablo eksik: ${table}`, 'npm run db:migrate çalıştırın');
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      pass(check, 'Tüm gerekli tablolar mevcut');
      return true;
    }

    return false;
  } catch (error) {
    fail(check, `Tablo kontrolü hatası: ${error.message}`, null);
    return false;
  }
}

async function checkRLSPolicies() {
  const check = CHECKS.RLS_POLICIES;
  log('🔍', `${check} kontrol ediliyor...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    fail(check, 'Credentials eksik', null);
    return false;
  }

  try {
    const supabase = createClient(url, anonKey);
    
    // Test anonymous read access to listings
    const { error } = await supabase
      .from('listings')
      .select('id')
      .eq('status', 'approved')
      .limit(1);

    if (error) {
      if (error.message.includes('permission denied') || error.code === 'PGRST301') {
        fail(
          check,
          'RLS policies çalışmıyor - anonymous okuma engelleniyor',
          'Supabase Dashboard > Database > Policies kontrol edin'
        );
        return false;
      }
      warn(check, `RLS test uyarısı: ${error.message}`);
      return true;
    }

    pass(check, 'RLS policies çalışıyor');
    return true;
  } catch (error) {
    fail(check, `RLS kontrolü hatası: ${error.message}`, null);
    return false;
  }
}

async function checkStorageBuckets() {
  const check = CHECKS.STORAGE_BUCKETS;
  log('🔍', `${check} kontrol ediliyor...`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const listingsBucket = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS;

  if (!url || !serviceKey) {
    fail(check, 'Admin credentials eksik', null);
    return false;
  }

  if (!listingsBucket) {
    warn(check, 'Storage bucket tanımlı değil (opsiyonel)');
    return true;
  }

  try {
    const supabase = createClient(url, serviceKey);
    const { error } = await supabase.storage.getBucket(listingsBucket);

    if (error) {
      fail(
        check,
        `Storage bucket bulunamadı: ${listingsBucket}`,
        'Supabase Dashboard > Storage > Create bucket'
      );
      return false;
    }

    pass(check, `Storage bucket mevcut: ${listingsBucket}`);
    return true;
  } catch (error) {
    fail(check, `Storage kontrolü hatası: ${error.message}`, null);
    return false;
  }
}

async function checkEmailSettings() {
  const check = CHECKS.EMAIL_SETTINGS;
  log('🔍', `${check} kontrol ediliyor...`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!appUrl) {
    fail(
      check,
      'NEXT_PUBLIC_APP_URL tanımlı değil',
      'Production URL ekleyin (örn: https://otoburada.com)'
    );
    return false;
  }

  // Local development için özel kontrol
  const isLocalDev = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  if (!appUrl.startsWith('https://') && !isLocalDev) {
    fail(
      check,
      'APP_URL https:// ile başlamalı',
      'Production için HTTPS zorunlu'
    );
    return false;
  }

  if (isLocalDev) {
    warn(check, 'Local development ortamı tespit edildi (http://localhost OK)');
  }

  if (!resendKey) {
    warn(check, 'RESEND_API_KEY tanımlı değil (email gönderimi çalışmayacak)');
  } else {
    pass(check, 'Email yapılandırması mevcut');
  }

  // Check Supabase email redirect URL
  log('💡', `   Supabase Dashboard > Auth > URL Configuration kontrol edin:`);
  log('💡', `   - Site URL: ${appUrl}`);
  log('💡', `   - Redirect URLs: ${appUrl}/auth/callback`);

  if (isLocalDev) {
    log('💡', `   - Production için HTTPS URL ekleyin`);
  }

  return true;
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ÖZET RAPOR');
  console.log('='.repeat(60));

  console.log(`\n✅ Başarılı: ${results.passed.length}`);
  console.log(`❌ Başarısız: ${results.failed.length}`);
  console.log(`⚠️  Uyarı: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n🔴 KRİTİK SORUNLAR:');
    results.failed.forEach(({ check, message, solution }) => {
      console.log(`\n${check}`);
      console.log(`  Problem: ${message}`);
      if (solution) {
        console.log(`  Çözüm: ${solution}`);
      }
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n🟡 UYARILAR:');
    results.warnings.forEach(({ check, message }) => {
      console.log(`  ${check}: ${message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed.length === 0) {
    console.log('✅ Tüm kritik kontroller başarılı!');
    console.log('💡 Hala sorun yaşıyorsanız:');
    console.log('   1. Vercel deployment logs kontrol edin');
    console.log('   2. Browser console errors kontrol edin');
    console.log('   3. Supabase Dashboard > Logs kontrol edin');
  } else {
    console.log('❌ Yukarıdaki sorunları çözün ve tekrar deneyin.');
    console.log('💡 Yardım için: https://supabase.com/docs/guides/auth');
  }

  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('🚀 OtoBurada Production Diagnostic\n');

  await checkEnvironmentVariables();
  console.log('');

  await checkSupabaseConnection();
  console.log('');

  await checkAuthConfiguration();
  console.log('');

  await checkDatabaseTables();
  console.log('');

  await checkRLSPolicies();
  console.log('');

  await checkStorageBuckets();
  console.log('');

  await checkEmailSettings();
  console.log('');

  await printSummary();

  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Diagnostic script hatası:', error);
  process.exit(1);
});
