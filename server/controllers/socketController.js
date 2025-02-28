const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Pub = require('../models/Pub');

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    socket.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      currentTeam: user.currentTeam
    };
    
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize Socket.IO controller
const initializeSocketController = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);
  
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);
    
    // If user has a team, join the team room
    if (socket.user.currentTeam) {
      try {
        const team = await Team.findById(socket.user.currentTeam);
        if (team) {
          socket.join(`team:${team._id}`);
          socket.join(`game:${team.game}`);
          console.log(`User ${socket.user.username} joined team ${team._id} in game ${team.game}`);
        }
      } catch (err) {
        console.error('Error joining team room:', err.message);
      }
    }
    
    // Handle joining a game room
    socket.on('join-game', async (gameId) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        socket.join(`game:${gameId}`);
        console.log(`User ${socket.user.username} joined game ${gameId}`);
        
        // Notify others in the game
        socket.to(`game:${gameId}`).emit('user-joined', {
          username: socket.user.username,
          userId: socket.user.id
        });
        
        // Send current game state to the user
        socket.emit('game-state', {
          gameId: game._id,
          status: game.status,
          teams: await Team.find({ game: gameId })
            .select('name color members pubs')
            .populate('members', 'username'),
          pubs: await Pub.find({ game: gameId })
            .select('name position owner neighbors')
        });
        
      } catch (err) {
        console.error('Error joining game room:', err.message);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });
    
    // Handle leaving a game room
    socket.on('leave-game', (gameId) => {
      socket.leave(`game:${gameId}`);
      console.log(`User ${socket.user.username} left game ${gameId}`);
      
      // Notify others in the game
      socket.to(`game:${gameId}`).emit('user-left', {
        username: socket.user.username,
        userId: socket.user.id
      });
    });
    
    // Handle pub conquest attempt
    socket.on('conquer-pub', async ({ gameId, pubId }) => {
      try {
        // Check if user is in a team
        if (!socket.user.currentTeam) {
          return socket.emit('error', { message: 'You must be in a team to conquer pubs' });
        }
        
        const game = await Game.findById(gameId);
        if (!game || game.status !== 'active') {
          return socket.emit('error', { message: 'Game not found or not active' });
        }
        
        const team = await Team.findById(socket.user.currentTeam);
        if (!team || team.game.toString() !== gameId) {
          return socket.emit('error', { message: 'You are not in a team for this game' });
        }
        
        const pub = await Pub.findById(pubId);
        if (!pub || pub.game.toString() !== gameId) {
          return socket.emit('error', { message: 'Pub not found in this game' });
        }
        
        // Check if pub can be conquered by this team
        let canConquer = false;
        
        // If pub has no owner, check if it's connected to a team-owned pub
        if (!pub.owner) {
          // Get all pubs owned by the team
          const teamPubs = await Pub.find({ game: gameId, owner: team._id });
          
          // Check if any neighboring pub is owned by the team
          for (const teamPub of teamPubs) {
            if (teamPub.neighbors.includes(pubId) || pub.neighbors.includes(teamPub._id)) {
              canConquer = true;
              break;
            }
          }
          
          // If team has no pubs yet, they can conquer any unowned pub
          if (teamPubs.length === 0) {
            canConquer = true;
          }
        } 
        // If pub is already owned by this team, no need to conquer
        else if (pub.owner.toString() === team._id.toString()) {
          return socket.emit('error', { message: 'This pub is already owned by your team' });
        } 
        // If pub is owned by another team, check if it's connected to a team-owned pub
        else {
          // Get all pubs owned by the team
          const teamPubs = await Pub.find({ game: gameId, owner: team._id });
          
          // Check if any neighboring pub is owned by the team
          for (const teamPub of teamPubs) {
            if (teamPub.neighbors.includes(pubId) || pub.neighbors.includes(teamPub._id)) {
              canConquer = true;
              break;
            }
          }
        }
        
        if (!canConquer) {
          return socket.emit('error', { message: 'You cannot conquer this pub yet' });
        }
        
        // Update pub owner
        const previousOwner = pub.owner;
        pub.owner = team._id;
        
        // Add to conquest history
        pub.conquestHistory.push({
          team: team._id,
          timestamp: Date.now()
        });
        
        await pub.save();
        
        // Add pub to team
        if (!team.pubs.includes(pubId)) {
          team.pubs.push(pubId);
          await team.save();
        }
        
        // Remove pub from previous owner team
        if (previousOwner) {
          const previousTeam = await Team.findById(previousOwner);
          if (previousTeam) {
            previousTeam.pubs = previousTeam.pubs.filter(p => p.toString() !== pubId.toString());
            await previousTeam.save();
          }
        }
        
        // Add event to game
        game.gameEvents.push({
          type: 'conquest',
          team: team._id,
          pub: pubId,
          user: socket.user.id,
          message: `${socket.user.username} from team ${team.name} conquered ${pub.name}`
        });
        await game.save();
        
        // Broadcast pub conquest to all users in the game
        io.to(`game:${gameId}`).emit('pub-conquered', {
          pubId,
          teamId: team._id,
          teamName: team.name,
          teamColor: team.color,
          conqueredBy: socket.user.username,
          timestamp: Date.now()
        });
        
        // Check for game over condition (all pubs owned by one team)
        const allPubs = await Pub.find({ game: gameId });
        const ownedPubs = await Pub.find({ game: gameId, owner: { $ne: null } });
        
        if (ownedPubs.length === allPubs.length) {
          // Group pubs by owner
          const pubsByTeam = {};
          for (const p of ownedPubs) {
            const teamId = p.owner.toString();
            pubsByTeam[teamId] = (pubsByTeam[teamId] || 0) + 1;
          }
          
          // Check if one team owns all pubs
          const teamIds = Object.keys(pubsByTeam);
          const totalPubCount = Object.values(pubsByTeam).reduce((sum, count) => sum + count, 0);
          
          if (teamIds.length === 1 && totalPubCount === allPubs.length) {
            const winningTeamId = teamIds[0];
            const winningTeam = await Team.findById(winningTeamId);
            
            // Update game status
            game.status = 'completed';
            game.winner = winningTeamId;
            game.settings.endTime = Date.now();
            
            // Add game end event
            game.gameEvents.push({
              type: 'game_end',
              team: winningTeamId,
              message: `Game ended. Team ${winningTeam.name} won by conquering all pubs`
            });
            
            await game.save();
            
            // Update player stats for winning team
            for (const memberId of winningTeam.members) {
              const member = await User.findById(memberId);
              member.gamesWon += 1;
              await member.save();
            }
            
            // Broadcast game over to all users in the game
            io.to(`game:${gameId}`).emit('game-over', {
              gameId,
              winner: {
                teamId: winningTeamId,
                teamName: winningTeam.name,
                teamColor: winningTeam.color
              },
              endTime: game.settings.endTime
            });
          }
        }
        
      } catch (err) {
        console.error('Error during pub conquest:', err.message);
        socket.emit('error', { message: 'Failed to conquer pub' });
      }
    });
    
    // Handle chat messages
    socket.on('send-message', async ({ gameId, message }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        const user = await User.findById(socket.user.id);
        let teamName = 'Spectator';
        let teamColor = '#999999';
        
        if (user.currentTeam) {
          const team = await Team.findById(user.currentTeam);
          if (team && team.game.toString() === gameId) {
            teamName = team.name;
            teamColor = team.color;
          }
        }
        
        // Broadcast message to all users in the game
        io.to(`game:${gameId}`).emit('chat-message', {
          userId: socket.user.id,
          username: socket.user.username,
          teamName,
          teamColor,
          message,
          timestamp: Date.now()
        });
        
      } catch (err) {
        console.error('Error sending chat message:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};

module.exports = {
  socketAuth,
  initializeSocketController
}; 