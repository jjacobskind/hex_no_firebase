'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PlayerSchema = new Schema({
  playerID: { type: Number, required: true },
  displayName: { type: String, required: true },
  playerName: { type: String, required: true },
  userRef:    { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  hasLongestRoad: { type: Boolean, required: true, default: false },
  hasLargestArmy: { type: Boolean, required: true, default: false },
  resources: {
    wool:   { type: Number, required: true, default: 0 },
    grain:  { type: Number, required: true, default: 0 },
    brick:  { type: Number, required: true, default: 0 },
    ore:    { type: Number, required: true, default: 0 },
    lumber: { type: Number, required: true, default: 0 }
  },
  resourceTotal: { type: Number, required: true, default: 0 },
  constructionPool: {
    cities:       { type: Number, required: true, default: 4 },
    settlements:  { type: Number, required: true, default: 5 },
    roads:        { type: Number, required: true, default: 15 }
  },
  devCards: {
    knight:       { type: Number, required: true, default: 0 },
    point:        { type: Number, required: true, default: 0 },
    monopoly:     { type: Number, required: true, default: 0 },
    plenty:       { type: Number, required: true, default: 0 },
    roadBuilding: { type: Number, required: true, default: 0 }
  },
  playerQualities: {
    settlements:            { type: Number, required: true, default: 0 },
    cities:                 { type: Number, required: true, default: 0 },
    roadSegments:           { type: Number, required: true, default: 0 },
    continuousRoadSegments: { type: Number, required: true, default: 0 },
    knightsPlayed:          { type: Number, required: true, default: 0 },
    privatePoints:          { type: Number, required: true, default: 0 }
  },
  tradingCosts: {
    wool:   { type: Number, required: true, default: 4 },
    grain:  { type: Number, required: true, default: 4 },
    brick:  { type: Number, required: true, default: 4 },
    ore:    { type: Number, required: true, default: 4 },
    lumber: { type: Number, required: true, default: 4 }
  },
  ownedProperties: {
    settlements: [{ settlementID: [Number] }],
    cities: [{ settlementID: [Number] }],
    roads: [{
      origin: [Number],
      destination: [Number]
    }]
  },
  rulesValidatedBuildableVertices: [ Schema.Types.Mixed ]
});

module.exports = mongoose.model('Player', PlayerSchema);