require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const groupRoutes = require('./routes/groupRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const reportRoutes = require('./routes/reportRoutes');
const banRoutes = require('./routes/banRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Redis
const redisClient = new Redis(process.env.REDIS_URL);

// Global rate limit
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bans', banRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  adapter: createAdapter(redisClient, redisClient.duplicate()),
  pingTimeout: 60000,
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('No token');
    const admin = require('./config/firebase-admin');
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.uid}`);
  require('./socket/index')(io, socket);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Shah backend running on port ${PORT}`);
});