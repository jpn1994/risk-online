const mongoose = require('mongoose');

const PubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  neighbors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pub'
  }],
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  conquestHistory: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Pub', PubSchema); 