const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Pub = require('../models/Pub');
const User = require('../models/User');

// @route   POST api/games
// @desc    Create a new game
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, settings } = req.body;

    // Create new game
    const game = new Game({
      name,
      admin: req.user.id,
      settings: settings || {}
    });

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/games
// @desc    Get all games
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const games = await Game.find()
      .populate('admin', 'username')
      .populate('teams', 'name color')
      .sort({ createdAt: -1 });
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/games/:id
// @desc    Get game by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('admin', 'username')
      .populate({
        path: 'teams',
        select: 'name color members',
        populate: {
          path: 'members',
          select: 'username'
        }
      })
      .populate('pubs', 'name position owner neighbors');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/games/:id
// @desc    Update game
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    let game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is admin
    if (game.admin.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update fields
    const { name, status, settings } = req.body;
    
    if (name) game.name = name;
    if (status) game.status = status;
    if (settings) game.settings = { ...game.settings, ...settings };
    
    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/games/:id/teams
// @desc    Create a team for a game
// @access  Private
router.post('/:id/teams', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in setup phase
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot add teams after game has started' });
    }
    
    // Check if max teams reached
    if (game.teams.length >= game.settings.maxTeams) {
      return res.status(400).json({ message: 'Maximum number of teams reached' });
    }
    
    // Create new team
    const team = new Team({
      name,
      color,
      game: req.params.id,
      members: [req.user.id]
    });
    
    await team.save();
    
    // Add team to game
    game.teams.push(team._id);
    await game.save();
    
    // Add user to team
    const user = await User.findById(req.user.id);
    user.currentTeam = team._id;
    await user.save();
    
    // Add event to game
    game.gameEvents.push({
      type: 'team_join',
      team: team._id,
      user: req.user.id,
      message: `${user.username} created team ${team.name}`
    });
    await game.save();
    
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/games/:id/pubs
// @desc    Add a pub to a game
// @access  Private (Admin only)
router.post('/:id/pubs', auth, async (req, res) => {
  try {
    const { name, position, neighbors } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is admin
    if (game.admin.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Create new pub
    const pub = new Pub({
      name,
      position,
      game: req.params.id
    });
    
    await pub.save();
    
    // Add neighbors if provided
    if (neighbors && neighbors.length > 0) {
      pub.neighbors = neighbors;
      await pub.save();
      
      // Add this pub as neighbor to other pubs
      for (const neighborId of neighbors) {
        const neighborPub = await Pub.findById(neighborId);
        if (neighborPub && !neighborPub.neighbors.includes(pub._id)) {
          neighborPub.neighbors.push(pub._id);
          await neighborPub.save();
        }
      }
    }
    
    // Add pub to game
    game.pubs.push(pub._id);
    await game.save();
    
    res.json(pub);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/games/:id/join/:teamId
// @desc    Join a team in a game
// @access  Private
router.post('/:id/join/:teamId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if team belongs to game
    if (team.game.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Team does not belong to this game' });
    }
    
    // Check if user is already in a team for this game
    const user = await User.findById(req.user.id);
    if (user.currentTeam) {
      const currentTeam = await Team.findById(user.currentTeam);
      if (currentTeam && currentTeam.game.toString() === req.params.id) {
        return res.status(400).json({ message: 'Already in a team for this game' });
      }
    }
    
    // Check if team is full
    if (team.members.length >= game.settings.maxPlayersPerTeam) {
      return res.status(400).json({ message: 'Team is full' });
    }
    
    // Add user to team
    if (!team.members.includes(req.user.id)) {
      team.members.push(req.user.id);
      await team.save();
    }
    
    // Update user's current team
    user.currentTeam = team._id;
    await user.save();
    
    // Add event to game
    game.gameEvents.push({
      type: 'team_join',
      team: team._id,
      user: req.user.id,
      message: `${user.username} joined team ${team.name}`
    });
    await game.save();
    
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/games/:id/start
// @desc    Start a game
// @access  Private (Admin only)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is admin
    if (game.admin.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if game is in setup phase
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Game has already started or ended' });
    }
    
    // Check if there are enough teams
    if (game.teams.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 teams to start a game' });
    }
    
    // Update game status
    game.status = 'active';
    game.settings.startTime = Date.now();
    
    // Add event to game
    game.gameEvents.push({
      type: 'game_start',
      user: req.user.id,
      message: `Game ${game.name} started`
    });
    
    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 