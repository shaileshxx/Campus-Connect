require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const { attachGlobalLocals } = require('./middleware/localsMiddleware');
const dns=require("dns");
dns.setServers(["1.1.1.1","8.8.8.8"]);
// Import modular route files
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const helpRoutes = require('./routes/helpRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_campus_db';

// Connect to MongoDB
connectDB();

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing & method override middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static assets (CSS, JS, PWA manifest, service worker, uploaded images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Express Session backed by MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'smart_campus_super_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Attach current user, flash alerts, and unread notification badge to all views
app.use(attachGlobalLocals);

// Register application routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);
app.use('/discussions', discussionRoutes);
app.use('/lost-found', lostFoundRoutes);
app.use('/help', helpRoutes);
app.use('/study-groups', studyGroupRoutes);
app.use('/hackathons', hackathonRoutes);
app.use('/bookmarks', bookmarkRoutes);
app.use('/notifications', notificationRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);

// Offline fallback route for Progressive Web App (PWA)
app.get('/offline', (req, res) => {
  res.render('errors/offline', { title: 'Offline | Smart Campus' });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found | Smart Campus' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).render('errors/500', {
    title: 'Server Error | Smart Campus',
    errorMessage: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`\n[Server] Smart Campus Management System running at http://localhost:${PORT}`);
});
