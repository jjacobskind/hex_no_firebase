export default function(Auth) {
  var playerData, playerID, playerDisplayName;
  return {
    setPlayerID: function(id){
      playerID = id;
    },
    getPlayerID: function(){
      return playerID;
    },
    setPlayerName: function(name) {
      playerDisplayName = name;
    },
    getPlayerName: function(){
      return playerDisplayName;
    }
  };
}
