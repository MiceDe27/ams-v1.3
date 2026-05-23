var admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env:", err.message);
    }
} else {
    try {
        serviceAccount = require("./firebase-service-key.json");
    } catch (err) {
        console.error("Local firebase-service-key.json not found:", err.message);
    }
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://ams-project-8fd8a-default-rtdb.firebaseio.com"
    });
}

module.exports = admin;