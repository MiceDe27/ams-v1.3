const AccountSchema = require('../models/accountModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const IV_LENGTH = 16;
const ENCRYPTION_KEY = 'your-32-byte-long-encryption-key-here'.padEnd(32).substring(0, 32);

function encryptData(text){
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptData(text){
    if (!text || !text.includes(':')) return text;
    try{
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');        
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    } catch (err) {
        return text;
    }
}

const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
};

exports.createAccount = async (req, res) =>{
    try{
        const Account = req.tenantDb.model('Account', AccountSchema);
        const idempotencyKey = req.headers['x-idempotency-key'] || crypto.randomBytes(16).toString('hex');

        if (idempotencyKey) {
            const existingAccount = await Account.findOne({ idempotencyKey });

            if (existingAccount) {
                const responseData = existingAccount.toObject();
                responseData.name = decryptData(responseData.name);
                responseData.email = decryptData(responseData.email);
                responseData.website = decryptData(responseData.website);
                responseData.password = decryptData(responseData.password); 
                return res.status(200).json(responseData);
            }
        }

        const accountData = {
            idempotencyKey,
            name: req.body.name ? encryptData(req.body.name) : undefined,
            email: req.body.email ? encryptData(req.body.email) : undefined,
            password: req.body.password ? encryptData(req.body.password) : undefined
        };

        if(idempotencyKey) accountData.idempotencyKey = idempotencyKey;

        if (req.body.website && req.body.website.trim() !== "") {
            accountData.website = encryptData(req.body.website);
        }

        const newAccount = new Account(accountData);
        const savedAccount = await newAccount.save();

        const responseData = savedAccount.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.email = decryptData(responseData.email);
        responseData.website = decryptData(responseData.website);
        responseData.password = decryptData(responseData.password); 

        res.status(201).json(responseData);
    } catch (err){
        res.status(400).json({message: err.message});
    }
};

exports.getAccounts = async (req, res) =>{
    try{
        const Account = req.tenantDb.model('Account', AccountSchema);
        const accounts = await Account.find();
        
        const decryptedAccounts = accounts.map(account => {
            const a = account.toObject();
            a.name = decryptData(a.name);
            a.email = decryptData(a.email);
            a.website = decryptData(a.website);
            a.password = decryptData(a.password); 
            return a;
        });

        res.json({ accounts: decryptedAccounts });
    } catch (err) {
        res.status(500).json({ message: err.message});
    }
};

exports.getAccountById = async (req, res) => {
    try{
        const Account = req.tenantDb.model('Account', AccountSchema);
        const account = await Account.findById(req.params.id);
        if (!account){
            return res.status(404).json({message: 'Account not Found'});
        }
         
        const responseData = account.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.email = decryptData(responseData.email);
        responseData.website = decryptData(responseData.website);
        responseData.password = decryptData(responseData.password); 

        res.json(responseData);
    } catch(err){
        res.status(500).json({ message: "Invalid ID format or Server Error "});
    }
};

exports.updateAccount = async (req, res) =>{
    try{
        const Account = req.tenantDb.model('Account', AccountSchema);
        
        const updateData = {};
        
        if (req.body.name) updateData.name = encryptData(req.body.name);
        if (req.body.email) updateData.email = encryptData(req.body.email);
        if (req.body.website) updateData.website = encryptData(req.body.website);
        if (req.body.password) updateData.password = encryptData(req.body.password);

        const updateAccount = await Account.findByIdAndUpdate(
            req.params.id,
            updateData, 
            { new: true, runValidators: true}
        );
        
        if (!updateAccount)
            return res.status(404).json({message: 'Account not found'});
        
        const responseData = updateAccount.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.email = decryptData(responseData.email);
        responseData.website = decryptData(responseData.website);
        responseData.password = decryptData(responseData.password); 

        res.json(responseData);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const Account = req.tenantDb.model('Account', AccountSchema);
        const deletedAccount = await Account.findByIdAndDelete(req.params.id);
        
        if (!deletedAccount) return res.status(404).json({ message: 'Account not found' });
        
        res.json({ message: 'Account successfully deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
