const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'studio.env') });  // Load studio.env file

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// Load environment variables
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH;
const SESSION_SECRET = process.env.SESSION_SECRET;

console.log('DB_PATH:', DB_PATH);
console.log('PORT:', PORT);
console.log('SESSION_SECRET:', SESSION_SECRET);

// Check if DB_PATH is correctly loaded
if (!DB_PATH || typeof DB_PATH !== 'string') {
    console.error("Database path is not defined or is not a valid string.");
    process.exit(1);  // Exit the process if DB_PATH is not correctly set
}

// Set up SQLite database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error(`Error connecting to the database: ${err.message}`);
    } else {
        console.log(`Connected to the SQLite database at ${DB_PATH}`);

        // Create bookings table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                session_from TEXT NOT NULL,
                session_to TEXT NOT NULL,
                services TEXT,
                special_request TEXT,
                status TEXT DEFAULT 'Pending'
            )
        `, (err) => {
            if (err) {
                console.error("Error creating bookings table:", err.message);
            } else {
                console.log("Bookings table created or already exists.");
            }
        });

        // Create news table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                date_posted TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error creating news table:", err.message);
            } else {
                console.log("News table created or already exists.");
            }
        });
    }
});

// Middleware for parsing incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Default route to verify server is running
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for handling booking submissions (POST /api/bookings)
app.post('/api/bookings', (req, res) => {
    const { name, email, phone, session_from, session_to, services, special_request } = req.body;

    const sql = `
        INSERT INTO bookings (name, email, phone, session_from, session_to, services, special_request, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;
    db.run(sql, [name, email, phone, session_from, session_to, services, special_request], function (err) {
        if (err) {
            console.error("Error inserting new booking:", err.message);
            res.status(500).json({ error: 'Failed to save booking request.' });
        } else {
            console.log(`Booking saved with ID: ${this.lastID}`);
            res.json({ message: 'Booking request submitted successfully.', id: this.lastID });
        }
    });
});

// Route to retrieve all bookings (GET /api/bookings)
app.get('/api/bookings', (req, res) => {
    const sql = `SELECT * FROM bookings`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error retrieving bookings:", err.message);
            res.status(500).json({ error: 'Failed to retrieve bookings.' });
        } else {
            res.json(rows);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Studio Site server running on port ${PORT}`);
});
