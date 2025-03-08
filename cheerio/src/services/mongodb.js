
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const uri = '';

// Function to connect to the database
const dbConnect = () => {
    mongoose.connect(uri);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    return db;
};

// User model
const userModel = () => {
    const userSchema = new mongoose.Schema({
        email: String,
        firstName: String,
        lastName: String,
        password: String,
    });
    const User = mongoose.model('Registered_users', userSchema);
    console.log('User model created successfully');
    return User;
};

// Chat model
const chatSchema = new mongoose.Schema({
    email: { type: String, required: true },
    question: { type: String, required: true },
    response: { type: [String], required: true },////////////changed
    timestamp: { type: Date, default: Date.now },
});

const chatModel = mongoose.model('Chat', chatSchema);

// Session store
const sessionStore = () => {
    const store = new MongoDBStore({
        uri: uri,
        collection: 'sessions',
    });

    store.on('error', function (error) {
        console.error(error);
    });

    return store;
};

// Export all functions and models
module.exports = {
    dbConnect,
    userModel,
    chatModel,
    sessionStore,
};
