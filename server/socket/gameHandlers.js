const Game = require('../models/Game');
const Team = require('../models/Team');
const Pub = require('../models/Pub');
const User = require('../models/User');

// Handle all game-related socket events
const handleGameEvents = (io, socket) => {
  console.log(`Setting up game event handlers for user ${socket.user.id}, socket ${socket.id}`);

  // Join a game room
  socket.on('join-game', async (gameId) => {
    console.log(`User ${socket.user.id} attempting to join game ${gameId}`);
    try {
      // Validate game ID
      if (!gameId) {
        throw new Error('Game ID is required');
      }
      
      // Check if the game exists
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error(`Game not found with ID: ${gameId}`);
      }
      
      const roomName = `game:${gameId}`;
      socket.join(roomName);
      
      console.log(`User ${socket.user.id} joined game room ${roomName}`);
      
      // Notify other users in the room
      socket.to(roomName).emit('user-joined', {
        userId: socket.user.id,
        username: socket.user.username || 'Unknown User'
      });
      
      // Get the game data to send to the user
      const fullGame = await Game.findById(gameId)
        .populate('teams')
        .populate('pubs')
        .exec();
      
      if (fullGame) {
        socket.emit('game-state', fullGame);
      }
    } catch (error) {
      console.error('Error joining game room:', error);
      socket.emit('error', { message: `Failed to join game room: ${error.message}` });
    }
  });
  
  // Leave a game room
  socket.on('leave-game', (gameId) => {
    socket.leave(`game:${gameId}`);
    
    // Notify other users in the room
    socket.to(`game:${gameId}`).emit('user-left', {
      userId: socket.user.id,
      username: socket.user.username
    });
  });
  
  // Conquer a pub
  socket.on('conquer-pub', async ({ gameId, pubId }) => {
    try {
      // Get the user's current team
      const user = await User.findById(socket.user.id);
      
      if (!user.currentTeam) {
        return socket.emit('error', { message: 'You are not in a team' });
      }
      
      // Check if the pub can be conquered by the user's team
      const pub = await Pub.findById(pubId);
      const game = await Game.findById(gameId);
      
      if (!pub || !game) {
        return socket.emit('error', { message: 'Pub or game not found' });
      }
      
      // Update the pub's owner
      pub.owner = user.currentTeam;
      pub.conquestHistory.push({
        team: user.currentTeam,
        timestamp: new Date()
      });
      
      await pub.save();
      
      // Add the pub to the team's list of pubs
      const team = await Team.findById(user.currentTeam);
      if (!team.pubs.includes(pubId)) {
        team.pubs.push(pubId);
        await team.save();
      }
      
      // Add a game event
      game.gameEvents.push({
        type: 'conquest',
        team: user.currentTeam,
        pub: pubId,
        user: socket.user.id,
        message: `${team.name} conquered ${pub.name}`
      });
      
      await game.save();
      
      // Notify all users in the game room
      io.to(`game:${gameId}`).emit('pub-conquered', {
        pubId,
        teamId: user.currentTeam,
        userId: socket.user.id,
        timestamp: new Date()
      });
      
      // Check if the game is over (all pubs conquered by one team)
      const allPubs = await Pub.find({ game: gameId });
      const allTeamPubs = await Pub.find({ game: gameId, owner: user.currentTeam });
      
      if (allPubs.length === allTeamPubs.length) {
        // Update the game to completed with winner
        game.status = 'completed';
        game.winner = user.currentTeam;
        game.settings.endTime = new Date();
        
        game.gameEvents.push({
          type: 'game_end',
          team: user.currentTeam,
          message: `${team.name} won the game!`
        });
        
        await game.save();
        
        // Notify all users in the game room that the game is over
        io.to(`game:${gameId}`).emit('game-over', {
          winnerId: user.currentTeam,
          winnerName: team.name
        });
      }
    } catch (error) {
      console.error('Error conquering pub:', error);
      socket.emit('error', { message: 'Failed to conquer pub' });
    }
  });
};

module.exports = { handleGameEvents }; 