require('./api/utils/nodeCompat.js');
const express = require('express');
const compression = require('compression');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { v2 } = require("cloudinary");
const { readdirSync } = require('fs');
const path = require('path');
const connectDatabase = require('./api/config/connectDatabase.js');

const app = express();
app.disable('x-powered-by');
app.use(compression()); // gzip/brotli-class compression for HTML, JSON and JS

app.use(express.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors({ origin: [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean) }));

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Backend Routes
readdirSync("./api/routes").map((r) => app.use("/api/", require('./api/routes/' + r)));
app.get('/api', (req, res) => {
    res.status(201).json({
        success: true,
        msg: "Server Running",
    });
});

// Frontend Routes
// Caching: hashed build files never change (cache for a year), fonts/images for a month, and the HTML
// is always revalidated so a new deploy is picked up immediately (the CDN may keep it for an hour).
const dist = path.resolve(__dirname, 'client', 'dist');
app.use(express.static(dist, {
    index: false,
    setHeaders(res, file) {
        // s-maxage lets Vercel's CDN keep its own copy, so these never wake the function again
        if (/[\\/]assets[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        else if (/\.(woff2|ttf|png|jpe?g|webp|avif|svg|ico)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');
        else res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    },
}));
app.get('*', (req, res) => {
    res.set('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.sendFile(path.join(dist, 'index.html'), (err) => {
        if (err) res.status(500).send(err);
    });
});

const PORT = process.env.PORT || 5000;
// Listen straight away so static files and the page shell never wait for MongoDB on a cold start;
// mongoose queues any query that arrives before the connection is ready.
app.listen(PORT, () => {
    console.log(`Connected to PORT => ${PORT}`);
});
connectDatabase();