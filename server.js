const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const base64url = require('base64url');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Mock local database
const users = {};

app.use(
    session({
      secret: 'supersecretkey', // Replace with a strong secret
      resave: false,            // Avoid resaving unchanged sessions
      saveUninitialized: false, // Do not save uninitialized sessions
      cookie: {
        secure: false,          // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day)
      },
    })
  );

const generateChallenge = () => base64url(crypto.randomBytes(32));

// 1. Register with username and password
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) return res.status(400).json({ error: 'User already exists' });

    users[username] = {
        password,
        credentials: [],
    };
    res.json({ message: 'User registered successfully' });
});

// 2. Enable WebAuthn
app.post('/webauthn/register', (req, res) => {
    const { username } = req.body;
    if (!users[username]) return res.status(404).json({ error: 'User not found' });

    const challenge = generateChallenge();
    req.session.challenge = challenge;
    req.session.username = username;

    res.json({
        publicKey: {
            challenge,
            rp: { name: 'WebAuthn Example' },
            user: {
                id: base64url(Buffer.from(username)),
                name: username,
                displayName: username,
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        },
    });
});

// 3. Save WebAuthn Credential
app.post('/webauthn/register/complete', (req, res) => {
    const { id, rawId, response, type } = req.body;
    const username = req.session.username;

    if (!username || !users[username]) return res.status(400).json({ error: 'Invalid session' });

    users[username].credentials.push({ id, rawId, type });
    res.json({ message: 'WebAuthn registered successfully' });
});

// 4. Login with WebAuthn
app.post('/webauthn/login', (req, res) => {
    const { username } = req.body;
    if (!users[username] || users[username].credentials.length === 0)
        return res.status(404).json({ error: 'WebAuthn not enabled for this user' });

    const challenge = generateChallenge();
    req.session.challenge = challenge;
    console.log(users[username].credentials);

    res.json({
        publicKey: {
            challenge,
            allowCredentials: users[username].credentials.map((cred) => ({
                id: cred.rawId,
                type: cred.type,
                transports: ['internal'],
            })),
        },
    });
});

// 5. Verify WebAuthn Login
app.post('/webauthn/login/complete', (req, res) => {
    const { id } = req.body;
    const username = req.session.username;

    if (!username || !users[username]) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'WebAuthn login successful' });
});

// 6. Login with password
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password)
        return res.status(400).json({ error: 'Invalid credentials' });

    req.session.username = username;
    res.json({ message: 'Password login successful' });
});

// Start server
app.listen(3001, () => console.log('Backend running on http://localhost:3001'));