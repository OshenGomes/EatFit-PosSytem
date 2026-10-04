// utils/firebaseAdmin.js
const fs = require('fs');
const path = require('path');

let admin = null;
let isInitialized = false;

try {
    admin = require('firebase-admin');
} catch (e) {
    // firebase-admin is optional
    admin = null;
}

function initFirebaseAdmin() {
    if (!admin) {
        return null;
    }

    if (isInitialized || (admin.apps && admin.apps.length > 0)) {
        isInitialized = true;
        return admin;
    }

    try {
        const possibleKeyPaths = [
            path.join(__dirname, '..', 'serviceAccountKey.json'),
            path.join(__dirname, '..', 'firebase-service-account.json')
        ];

        let serviceAccount = null;
        for (const p of possibleKeyPaths) {
            if (fs.existsSync(p)) {
                serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
                break;
            }
        }

        if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch {
                const buff = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64');
                serviceAccount = JSON.parse(buff.toString('utf-8'));
            }
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            isInitialized = true;
            console.log('✅ Firebase Admin initialized with service account');
        } else {
            try {
                admin.initializeApp();
                isInitialized = true;
                console.log('✅ Firebase Admin initialized with default credentials');
            } catch (appErr) {
                // Standalone mode
            }
        }
    } catch (err) {
        console.warn('⚠️ Firebase Admin init notice:', err.message);
    }

    return admin;
}

initFirebaseAdmin();

module.exports = {
    admin,
    isConfigured: () => Boolean(admin && isInitialized && admin.apps && admin.apps.length > 0)
};
