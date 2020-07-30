class Player {
	constructor(player_id) {
		this.id = player_id
		this.current_role = 'guesser'
		this.score = 150
		this.place = 'gold'
	}	
}

class Game {
	constructor(game_id, max_rounds) {
		this.game_id = game_id;
		this.phase = 'pregame'
		this.players = {/* player objects */};
		this.rounds = [/* round objects */]
		this.max_rounds = max_rounds;
		this.current_round_id = 0;
	}
}

class Round {
	constructor(round_id, players) {
		this.round_id = round_id;
		this.turns = function() { // = ordered list of turns with an artist id for each one. ordering defined by Game.players ordering
			turn_array = [];
			for(var player in players) {
				turn_array.push(new Turn(players, player_id))
			}
			return turn_array;
		}
		this.current_turn_id = 0;
	}
}

class Turn {
	constructor(players, artist_id) {
		this.artist_id = artist_id;
		this.phase = 'choosing' // transitions after to drawing, then to finishing (where the points gained for the turn are shown)
		this.duration = 90 //seconds
		this.points_this_turn = function() {
			points = {};
			for(var player in players) {
				id = player.id
				points[id] = 0;
			}
			return points;
		}
	}
}

Game.prototype.playerAdd = function(player) {
	this.players[player.id] = player; // add new player to the game object
}

Game.prototype.playerRemove = function(player_id) {
	delete this.players[player_id] // remove player from the game object
}

Game.prototype.gameEnd = function() {
	// set winner = player id of winner
	// if only 1 player left in game, winner = the last player left
}

Game.prototype.playerLeftGame = function(player_id) {

	round_id = this.current_round_id
	round = this.rounds.round_id

	delete round.turns.player_id // This player will no longer have a turn drawing this round as they have left.
	delete this.players.player_id // This player is no longer in the game.

	if (Object.keys(this.players).length < 2 && this.phase == 'midgame') {
		this.phaseNext();
	}

}

Game.prototype.gameStart = function() {
	// Start Game from Lobby (pregame stage)
	if (this.phase == 'pregame' && this.players.length > 1 ) {
		// create 3 rounds,
		this.phase = 'midgame'
	// End the game, displaying 
	}
}

Game.prototype.transition = function() {
	// Start Game from Lobby (pregame stage)
	if (this.phase == 'pregame' && this.players.length > 1 ) {
		this.phase = 'midgame'
	// End the game, displaying 
	} else if (this.phase == 'midgame') { //
		game

	}
}

Game.prototype.callNextRound = function() {
	next_round = new Round(this.current_round_id + 1, this.players)
	// set variables for next_round here
	this.rounds.push(next_round)
	this.current_round_id++;
};

module.exports = {
	Player,
	Game,
	Round,
	Turn
  }