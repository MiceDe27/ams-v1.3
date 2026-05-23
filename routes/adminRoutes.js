const express = require('express');
const router = express.Router();
const admin = require('../config/firebase'); 
const Tenant = require('../models/tenant'); 


router.post('/register-tenant', async (req, res) => {
    const { email, password, tenantName, tenantId } = req.body;

    try {
        const existingTenant = await Tenant.findOne({ tenantId });
        if (existingTenant) {
            return res.status(400).json({ error: "Tenant ID already taken. Choose another one." });
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: tenantName,
        });


        await admin.auth().setCustomUserClaims(userRecord.uid, { 
            tenantId: tenantId 
        });

        const newTenant = new Tenant({
            tenantId,
            companyName: tenantName,
            adminUid: userRecord.uid,
            status: 'active',
            plan: 'basic'
        });

        await newTenant.save();

        res.status(201).json({
            message: `Tenant ${tenantName} successfully registered!`,
            tenantId: tenantId,
            firebaseUid: userRecord.uid
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;