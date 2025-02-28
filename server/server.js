require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const { auth, authenticateSocket } = require('./middleware/auth');
const { handleGameEvents } = require('./socket/gameHandlers');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : [process.env.CLIENT_URL || 'http://localhost:3000'];

console.log('Allowed CORS origins:', corsOrigins);

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Debug route for checking server health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.IO middleware and event handlers
io.use(authenticateSocket);
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Register game event handlers
  handleGameEvents(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subrisk')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }); 