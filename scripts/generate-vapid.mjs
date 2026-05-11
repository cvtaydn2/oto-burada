import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log('=========================================');
console.log('🔑 VAPID KEYS GENERATED SUCCESSFULLY 🔑');
console.log('=========================================');
console.log('\nAdd the following lines to your .env / .env.local file:');
console.log('\n# Web Push Configurations');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@oto-burada.vercel.app`);
console.log('\n=========================================');
