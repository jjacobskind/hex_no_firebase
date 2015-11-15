var ResourceManager = function(game) {
  this.game = game;
};

ResourceManager.prototype.areResourcesAvailable = function(playerID, purchase_type) {
  var resources_available = this.playerHasEnoughResourceCards(playerID, purchase_type);
  if(resources_available !== true) { return resources_available; }
  if(purchase_type === 'development_card') { return this.developmentCardsAvailable(); }
  return this.playerHasEnoughTokens(playerID, purchase_type);
};

ResourceManager.prototype.playerHasEnoughResourceCards = function(playerID, purchase_type) {
  if(this.game.boardSetupPhase) { return true; }
  var player = this.game.players[playerID];

  var purchase_price = this.costMap[purchase_type];
  var error_prefix = 'Not enough resources to build a ';
  if(purchase_type === 'development_card') { error_prefix = 'Not enough resources to buy a '; }

  for(var key in purchase_price) {
    if(player.resources[key] < purchase_price[key]) { return { err: error_prefix + purchase_type + '!' } }
  }
  return true;
};

ResourceManager.prototype.costMap = {
  settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { ore: 3, grain: 2 },
  road: { brick: 1, lumber: 1 },
  development_card: { grain: 1, ore: 1, wool: 1 }
};

ResourceManager.prototype.playerHasEnoughTokens = function(playerID, purchase_type) {
  var player = this.game.players[playerID];
  return player.constructionPool[purchase_type] > 0;
};

ResourceManager.prototype.developmentCardsAvailable = function() {
  cards_available = this.game.development_card_deck.length > 0;
  return cards_available || { err: 'All development cards have been purchased!' }
};

ResourceManager.prototype.chargeForPurchase = function(playerId, purchase_type) {
  if(this.game.boardSetupPhase) { return null; }
  var cost = this.costMap[purchase_type];
  for(var resource in cost) {
    this.game.players[playerID].resources[resource] -= cost[resources];
  }
};

if(typeof require !== 'undefined') {
  module.exports = ResourceManager;
}
