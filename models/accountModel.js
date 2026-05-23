const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email:{type: String, required:true},
    password: {type: String, required:true},
    website: {type: String, required: true}
},
{timestamps:true}
);

module.exports = AccountSchema;