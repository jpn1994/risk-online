const jwt = require('jsonwebtoken');

// Middleware for Express routes
const auth = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware for Socket.IO connections
const authenticateSocket = (socket, next) => {
  console.log('Authenticating socket connection...');
  
  // Get token from handshake auth
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('Socket authentication failed: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to socket
    socket.user = decoded.user;
    console.log(`Socket authenticated for user: ${socket.user.id}`);
    next();
  } catch (err) {
    console.error(`Socket authentication failed: ${err.message}`);
    
    if (err.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    } else if (err.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token format'));
    }
    
    next(new Error(`Authentication error: ${err.message}`));
  }
};

module.exports = { auth, authenticateSocket }; 