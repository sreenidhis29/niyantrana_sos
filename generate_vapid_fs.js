const webpush = require('web-push');
const fs = require('fs');
const vapidKeys = webpush.generateVAPIDKeys();
fs.writeFileSync('vapid_keys_clean.txt', `PUBLIC=${vapidKeys.publicKey}\nPRIVATE=${vapidKeys.privateKey}\n`, 'utf8');
