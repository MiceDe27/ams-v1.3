const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
        return;
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
    console.error('Failed to connect to MongoDB. Exiting.');
    process.exit(1);
};

module.exports = connectDB;