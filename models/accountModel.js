const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email:{type: String, required:true},
    password: {type: String, required:true},
    website: {type: String, required: false}
},
{timestamps:true}
);

module.exports = AccountSchema;
