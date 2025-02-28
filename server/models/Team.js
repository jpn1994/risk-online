const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#FF5733'
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pub'
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', TeamSchema); 