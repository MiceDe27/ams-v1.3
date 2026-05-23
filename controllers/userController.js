const UserSchema = require('../models/user');

exports.createUser = async (req, res) => {
    try {
        const TenantUser = req.tenantDb.model('User', UserSchema);
        
        const newUser = new TenantUser(req.body);
        await newUser.save();

        res.status(201).json({
            message: `User created in ${req.tenantDb.name}`,
            data: newUser
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const TenantUser = req.tenantDb.model('User', UserSchema);
        const users = await TenantUser.find();
        
        res.status(200).json({
            database: req.tenantDb.name,
            count: users.length,
            users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};