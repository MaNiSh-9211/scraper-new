const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const { runPuppeteer } = require('./public/scripts/purp2.js');
const shamodule = require('./src/services/sha');
const { dbConnect, userModel, sessionStore, chatModel } = require('./src/services/mongodb.js');
// const { chatModel } = require('./src/services/mongodb.js');

const app = express();
const port = 9000;

const db = dbConnect();
const User = userModel();
const store = sessionStore();

// Configure session middleware
app.use(session({
    secret: 'mazak thodi h', // Replace with your secret key
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: false,
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year expiration (in milliseconds)

     } // Set secure: true if using HTTPS
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', './cheerio/public/views');

app.listen(port, (err) => {
    if (err) {
        console.log('An error has occurred on starting server', err);
    } else {
        console.log(`Server has started on port ${port}`);
    }
});


// for cursor
app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
        res.sendFile(`cheerio/public/images/${imageName}`, { root: './' });
});

// Ensure session middleware is used before any routes that require session data
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.render('dashboard');
    } else {
        res.redirect('/');
    }
});

app.get('/dashboard.css', (req, res) => {
    res.sendFile('cheerio/public/styles/dashboard.css', { root: './' });
});

app.get('/dashboard.js', (req, res) => {
    res.sendFile('cheerio/public/scripts/dashboard.js', { root: './' });
});

app.get('/logo', (req, res) => {
    res.sendFile('cheerio/public/images/white-ghost.gif', { root: './' });
});


// app.get('/sub-button', (req, res) => {
//     res.sendFile('cheerio/public/images/send_prompt.png', { root: './' });
// });

app.get('/icon', (req, res) => {
    res.sendFile('cheerio/public/images/white-ghost.gif', { root: './' });
});

// Registration Process
// Register html
app.get('/register', (req, res) => {
    res.sendFile('cheerio/public/register.html', { root: './' });
});
// Register css
app.get('/register.css', (req, res) => {
    res.sendFile('cheerio/public/styles/register.css', { root: './' });
});

// Register post
app.post('/register', async (req, res) => {
    let { email, firstName, lastName, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send('User already exists');
        }

        password = await shamodule.sha(password);
        console.log('Hashed password is:', password);
        const newUser = new User({ email, firstName, lastName, password });
        await newUser.save();

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Login html
app.get('/', (req, res) => {
    res.sendFile('cheerio/public/login.html', { root: './' });
});
// Login css
app.get('/login.css', (req, res) => {
    res.sendFile('cheerio/public/styles/login.css', { root: './' });
});
// Login post
app.post('/', async (req, res) => {
    let { email, password } = req.body;

    try {
        // Find user in MongoDB
        password = await shamodule.sha(password);
        const validUser = await User.findOne({ email, password });

        if (validUser) {
            // Store user data in session
            req.session.user = validUser;
            // Redirect to dashboard
            res.redirect('/dashboard');
        } else {
            res.send('Incorrect username or password');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        } else {
            res.redirect('/');
        }
    });
});

app.post('/prompt', async (req, res) => {
    const { prompt } = req.body;

    console.log(prompt)
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    const userEmail = req.session.user.email;

    try {
        const response = await runPuppeteer(prompt); // Generate response using Puppeteer
        
        // Save question and response to the database
        const chatEntry = new chatModel({ 
            email: userEmail, 
            question: prompt, 
            response 
        });
        await chatEntry.save();

        res.json({ response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/chats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Fetch chats for the logged-in user from the database
        const chats = await chatModel.find({ email: req.session.user.email }).sort({ timestamp: -1 });

        res.json({ chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/chats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Get the user's email from the session
        const userEmail = req.session.user.email;

        // Delete all chat entries for the user
        await chatModel.deleteMany({ email: userEmail });

        res.status(200).send('All chats deleted successfully');
    } catch (error) {
        console.error('Error deleting chats:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to delete a specific chat by its _id
app.delete('/chat/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const chatId = req.params.id;
        const deletedChat = await chatModel.findOneAndDelete({ _id: chatId, email: req.session.user.email });

        if (!deletedChat) {
            return res.status(404).send('Chat not found');
        }

        res.status(200).send('Chat deleted successfully');
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// In index.js, added session import at the top and passed app to sessionStore.
// In mongodb.js, reordered imports to ensure session is initialized before using it with connect-mongodb-session.
// These changes should keep the session initialization within the sessionStore function and avoid the ReferenceError.