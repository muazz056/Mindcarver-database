const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'x8f2!pD9#kL3$qW7%zR5&vN1*mJ6(cY4)';

// CORS Configuration with all possible frontend URLs
const allowedOrigins = [
    'http://localhost:3000',
    'https://mindcarver-database-mc1.vercel.app',
    'https://mindcarver-database-mc1-nqh1nwugh-muazs-projects-f59b1282.vercel.app'
];

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
};

// Important: Order of middleware matters!
// 1. Basic middleware
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Session middleware (must be before any route handling)
const sessionConfig = {
    name: 'connect.sid',
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    rolling: true,
    unset: 'destroy',
    proxy: true,
    cookie: {
        httpOnly: true,
        secure: false, // Must be false for non-HTTPS
        sameSite: 'none', // Changed to none for cross-origin
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
        domain: '.glitch.me' // Add the domain
    }
};

// Use different settings for production
if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Debug middleware to log session
app.use((req, res, next) => {
    // Add CORS headers on every response
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    
    console.log('Request URL:', req.url);
    console.log('Request Origin:', req.headers.origin);
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Helper function to detect column type
function detectColumnType(value) {
    if (value === null || value === undefined || value === '') {
        return 'TEXT';
    }
    
    // Check if it's a number
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
        // Check if it's an integer
        if (Number.isInteger(parseFloat(value))) {
            return 'INTEGER';
        }
        return 'REAL';
    }
    
    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        return 'TEXT'; // Store dates as TEXT for simplicity
    }
    
    return 'TEXT';
}

// Helper function to analyze CSV columns
function analyzeCSVColumns(data) {
    const columns = {};
    
    data.forEach(row => {
        Object.keys(row).forEach(column => {
            if (!columns[column]) {
                columns[column] = [];
            }
            columns[column].push(row[column]);
        });
    });
    
    const columnTypes = {};
    Object.keys(columns).forEach(column => {
        const values = columns[column].filter(v => v !== null && v !== undefined && v !== '');
        if (values.length === 0) {
            columnTypes[column] = 'TEXT';
        } else {
            // Analyze first few non-empty values to determine type
            const sampleValues = values.slice(0, 10);
            const types = sampleValues.map(detectColumnType);
            
            // If all are integers, use INTEGER
            if (types.every(t => t === 'INTEGER')) {
                columnTypes[column] = 'INTEGER';
            }
            // If all are numbers (INTEGER or REAL), use REAL
            else if (types.every(t => t === 'INTEGER' || t === 'REAL')) {
                columnTypes[column] = 'REAL';
            }
            // Default to TEXT
            else {
                columnTypes[column] = 'TEXT';
            }
        }
    });
    
    return columnTypes;
}

// Authentication middleware
const authenticate = (req, res, next) => {
    console.log('Auth check - Session Data:', req.session);
    if (req.session && req.session.user === 'admin' && req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { 
        username,
        sessionID: req.sessionID,
        origin: req.headers.origin 
    });
    
    if (username === 'admin' && password === 'Mindcarver1@') {
        // Set session data
        req.session.user = 'admin';
        req.session.authenticated = true;
        
        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            console.log('Session saved successfully. Session data:', req.session);
            
            // Set additional headers for CORS
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            
            res.json({ 
                message: 'Login successful',
                sessionID: req.sessionID
            });
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Auth check endpoint
app.get('/api/auth/check', (req, res) => {
    console.log('Auth check - Full session data:', {
        id: req.sessionID,
        session: req.session
    });
    
    if (req.session && req.session.user === 'admin' && req.session.authenticated) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    console.log('Logout - Session before destroy:', req.session);
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });
            console.log('Logout successful - Session destroyed');
            res.json({ message: 'Logged out successfully' });
        });
    } else {
        res.json({ message: 'Already logged out' });
    }
});

// Protected route middleware - Apply to all /api routes except login, logout, and auth check
app.use('/api', (req, res, next) => {
    if (
        req.path === '/login' ||
        req.path === '/logout' ||
        req.path === '/auth/check' ||
        req.method === 'OPTIONS'
    ) {
        return next();
    }
    authenticate(req, res, next);
});

// Routes

// Get all tables
app.get('/api/tables', (req, res) => {
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(tables.map(table => table.name));
    });
});

// Get table data with optional filtering
app.get('/api/tables/:tableName', (req, res) => {
    const { tableName } = req.params;
    const { search, ...filters } = req.query;
    
    let query = `SELECT rowid, * FROM "${tableName}"`;
    let params = [];
    let whereConditions = [];
    
    // Add search functionality
    if (search) {
        // First, get column names
        db.all(`PRAGMA table_info("${tableName}")`, (err, columns) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const searchConditions = columns.map(col => `"${col.name}" LIKE ?`);
            whereConditions.push(`(${searchConditions.join(' OR ')})`);
            params = params.concat(columns.map(() => `%${search}%`));
            
            // Add column-specific filters
            Object.keys(filters).forEach(column => {
                if (filters[column]) {
                    whereConditions.push(`"${column}" = ?`);
                    params.push(filters[column]);
                }
            });
            
            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }
            
            db.all(query, params, (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows);
            });
        });
    } else {
        // Add column-specific filters only
        Object.keys(filters).forEach(column => {
            if (filters[column]) {
                whereConditions.push(`"${column}" = ?`);
                params.push(filters[column]);
            }
        });
        
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }
});

// Get unique values for a column (for filter dropdowns)
app.get('/api/tables/:tableName/columns/:columnName/values', (req, res) => {
    const { tableName, columnName } = req.params;
    
    db.all(`SELECT DISTINCT "${columnName}" FROM "${tableName}" WHERE "${columnName}" IS NOT NULL AND "${columnName}" != '' ORDER BY "${columnName}"`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row[columnName]));
    });
});

// Get table schema
app.get('/api/tables/:tableName/schema', (req, res) => {
    const { tableName } = req.params;
    
    db.all(`PRAGMA table_info("${tableName}")`, (err, columns) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(columns);
    });
});

// Upload CSV and create/insert into table
app.post('/api/upload', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { tableName, action } = req.body; // action: 'create' or 'insert'
    const csvData = [];
    
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => csvData.push(data))
        .on('end', () => {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            if (csvData.length === 0) {
                return res.status(400).json({ error: 'CSV file is empty' });
            }
            
            const columns = Object.keys(csvData[0]);
            
            if (action === 'create') {
                // Analyze column types
                const columnTypes = analyzeCSVColumns(csvData);
                
                // Create table
                const columnDefinitions = columns.map(col => `"${col}" ${columnTypes[col]}`);
                const createTableQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefinitions.join(', ')})`;
                
                db.run(createTableQuery, (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // Insert data
                    insertData(tableName, columns, csvData, res);
                });
            } else {
                // Insert into existing table
                insertData(tableName, columns, csvData, res);
            }
        })
        .on('error', (err) => {
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Error parsing CSV: ' + err.message });
        });
});

function insertData(tableName, columns, csvData, res) {
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const insertQuery = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare(insertQuery);
        let insertedCount = 0;
        
        csvData.forEach((row) => {
            const values = columns.map(col => row[col] || null);
            stmt.run(values, (err) => {
                if (err) {
                    console.error('Error inserting row:', err);
                } else {
                    insertedCount++;
                }
            });
        });
        
        stmt.finalize((err) => {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
            } else {
                db.run('COMMIT', (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ 
                            message: `Successfully processed ${insertedCount} rows`,
                            tableName: tableName,
                            rowsInserted: insertedCount
                        });
                    }
                });
            }
        });
    });
}

// Delete a table
app.delete('/api/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    
    try {
        // First check if table exists
        const table = await new Promise((resolve, reject) => {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [tableName], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        // Table exists, proceed with deletion
        await new Promise((resolve, reject) => {
            db.run(`DROP TABLE "${tableName}"`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: `Table ${tableName} successfully deleted` });
    } catch (err) {
        console.error('Error deleting table:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a row from a table
app.delete('/api/tables/:tableName/rows/:rowId', async (req, res) => {
    const { tableName, rowId } = req.params;
    
    try {
        // First check if row exists
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT rowid FROM "${tableName}" WHERE rowid = ?`, [rowId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!row) {
            return res.status(404).json({ error: 'Row not found' });
        }
        
        // Row exists, proceed with deletion
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM "${tableName}" WHERE rowid = ?`, [rowId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: 'Row successfully deleted' });
    } catch (err) {
        console.error('Error deleting row:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update a row in a table
app.put('/api/tables/:tableName/rows/:rowId', async (req, res) => {
    const { tableName, rowId } = req.params;
    const updates = req.body;
    
    try {
        // First check if row exists
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT rowid FROM "${tableName}" WHERE rowid = ?`, [rowId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!row) {
            return res.status(404).json({ error: 'Row not found' });
        }
        
        // Build the update query
        const setClauses = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
        const values = [...Object.values(updates), rowId];
        
        const query = `UPDATE "${tableName}" SET ${setClauses} WHERE rowid = ?`;
        
        // Row exists, proceed with update
        await new Promise((resolve, reject) => {
            db.run(query, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ message: 'Row successfully updated' });
    } catch (err) {
        console.error('Error updating row:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get a single row by rowid
app.get('/api/tables/:tableName/rows/:rowId', async (req, res) => {
    const { tableName, rowId } = req.params;
    
    try {
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT rowid, * FROM "${tableName}" WHERE rowid = ?`, [rowId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!row) {
            return res.status(404).json({ error: 'Row not found' });
        }
        
        res.json(row);
    } catch (err) {
        console.error('Error fetching row:', err);
        res.status(500).json({ error: err.message });
    }
});

// Restore a deleted row
app.post('/api/tables/:tableName/rows', async (req, res) => {
    const { tableName } = req.params;
    const rowData = req.body;
    
    try {
        // First check if table exists
        const table = await new Promise((resolve, reject) => {
            db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [tableName], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        // Build the insert query
        const columns = Object.keys(rowData);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(rowData);
        
        const query = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
        
        // Table exists, proceed with insert
        const result = await new Promise((resolve, reject) => {
            db.run(query, values, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        res.json({ 
            message: 'Row successfully restored',
            rowid: result
        });
    } catch (err) {
        console.error('Error restoring row:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});