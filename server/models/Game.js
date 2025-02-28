const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  pubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pub'
  }],
  status: {
    type: String,
    enum: ['setup', 'active', 'completed'],
    default: 'setup'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  settings: {
    maxTeams: {
      type: Number,
      default: 4
    },
    maxPlayersPerTeam: {
      type: Number,
      default: 5
    },
    conquestSpeed: {
      type: Number,
      default: 1
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    }
  },
  gameEvents: [{
    type: {
      type: String,
      enum: ['conquest', 'team_join', 'game_start', 'game_end'],
      required: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    pub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pub'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema); 