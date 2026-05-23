const admin = require('../config/firebase');
const mongoose = require('mongoose');
const Tenant = require('../models/tenant');

const tenantResolver = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const headerTenantId = req.headers['x-tenant-id']; // Kunin yung pinasa mo sa frontend

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Gamitin ang pinasa sa header kung wala pang custom claims
        let tenantId = decodedToken.tenantId || headerTenantId || decodedToken.uid;

        if (!tenantId) {
            return res.status(403).json({ error: "Forbidden: No tenant identifier found" });
        }

        // Switching Database logic
        // Gagamit ng 'db_' prefix + tenantId (Firebase UID)
        const dbName = `db_${tenantId.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const tenantDb = mongoose.connection.useDb(dbName, { useCache: true });
        
        req.tenantDb = tenantDb;
        req.user = decodedToken; 
        req.tenantId = tenantId;

        next();
    } catch (err) {
        console.error("Firebase Auth Error:", err.message);
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
};

module.exports = tenantResolver;