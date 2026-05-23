const ContactSchema = require('../models/contactModel');
const fs = require('fs');
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
    if (!text || typeof text !== 'string' || !text.includes(':')) {
        return text;
    }
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

exports.createContact = async (req, res) => {
    try{
        const Contact = req.tenantDb.model('Contact', ContactSchema);
        
        const idempotencyKey = req.headers['x-idempotency-key'] || crypto.randomBytes(16).toString('hex');
        
        if(!idempotencyKey){
            return res.status(400).json({ message: 'Idempotency key is required in the header'});
        }

        const existingContact = await Contact.findOne({ idempotencyKey });
        if (existingContact){
            const responseData = existingContact.toObject();
            responseData.name = decryptData(responseData.name);
            responseData.number = decryptData(responseData.number);
            responseData.email = decryptData(responseData.email);
            return res.status(200).json(responseData);
        }

        const contactData = {
            idempotencyKey: idempotencyKey,
            name: encryptData(req.body.name),
            number: encryptData(req.body.number),
            email: encryptData(req.body.email),
            photo: req.body.photo || 'assets/contact/svg'
        };
        if (req.file){
            contactData.photo = generateUniqueFilename(req.file.originalname);
        };
        const newContact = new Contact(contactData);
        const savedContact = await newContact.save();

        const responseData = savedContact.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.number = decryptData(responseData.number);
        responseData.email = decryptData(responseData.email);

        res.status(201).json(responseData);
    }catch (err){
        res.status(400).json({ message: err.message});
    }
};

exports.getContact = async (req, res) => {
    try{
        const Contact = req.tenantDb.model('Contact', ContactSchema);
        const contacts = await Contact.find().sort({createdAt: -1});

        const decryptedContacts = contacts.map(contact => {
            const c = contact.toObject();
            c.name = decryptData(c.name);
            c.number = decryptData(c.number);
            c.email = decryptData(c.email);
            return c;
        });

        res.json({ contacts: decryptedContacts });
    }catch (err){
        res.status(500).json({ message: err.message});
    }
};

exports.getContactById = async (req, res) => {
    try{
        const Contact = req.tenantDb.model('Contact', ContactSchema);
        const contact = await Contact.findById(req.params.id);
        if (!contact){
            return res.status(404).json({message: 'Contact not Found'});
        }

        const responseData = contact.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.number = decryptData(responseData.number);
        responseData.email = decryptData(responseData.email);
         
        res.json(responseData);
    } catch(err){
        res.status(500).json({ message: "Invalid ID format or Server Error "});
    }
};

exports.updateContact = async (req, res) => {
    try {
        const Contact = req.tenantDb.model('Contact', ContactSchema);
        
        const updateData = {
            name: encryptData(req.body.name),
            number: encryptData(req.body.number),
            email: encryptData(req.body.email),
        };
        if (req.body.photo) {
            updateData.photo = req.body.photo;
        }
        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        const responseData = updatedContact.toObject();
        responseData.name = decryptData(responseData.name);
        responseData.number = decryptData(responseData.number);
        responseData.email = decryptData(responseData.email);
        
        res.json(responseData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteContact = async (req, res) => {
    try{
        const Contact = req.tenantDb.model('Contact', ContactSchema);
        const contact = await Contact.findById(req.params.id);
        if (!contact)
            return res.status(404).json({ message: 'Contact not found'});
        if (contact.photo && !contact.photo.startsWith('data:image')){
            fs.unlink(contact.photo, (err) =>{
                if (err) console.log("Failed to delete file:", err);
            });
        }
        await Contact.findByIdAndDelete(req.params.id);
        res.json({message: 'Contact and photo deleted successfully'});
    }catch (err){
        res.status(500).json({ message: err.message});
    }
};