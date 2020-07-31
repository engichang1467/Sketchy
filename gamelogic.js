class Player {
	constructor(player_id) {
		this.id = player_id
		this.current_role = 'guesser' // default role
		this.score = 150 // placeholder
		this.place = 'gold' // placeholder
	}	
}

class Game {
	constructor(game_id, max_rounds) {
		this.game_id = game_id;
		this.host = ''
		this.phase = 'pregame'
		this.players = {/* player object keys */};
		this.rounds = {}
		this.max_rounds = max_rounds;
		this.current_round_id = 1;
		this.timer_seconds = 0;
		this.drawing_duration = 15 //seconds
		this.choosing_duration = 5 //seconds
	}
}

class Round {
	constructor(round_id, players) {
		this.round_id = round_id;
		this.turns = this.getTurns(players);
		this.current_turn_id = 0;
	}
}

Round.prototype.getTurns = function(players) {
	turn_array = [];
	for(var player in players) {
		turn_array.push(new Turn(players, player.id))
	}
	return turn_array;
}

class Turn {
	constructor(players, artist_id) {
		this.artist_id = artist_id;
		this.phase = 'waiting' // transitions after to drawing, then to finishing (where the points gained for the turn are shown)
		// choosing phase = picking the word, drawing phase = drawing, ending phase = show the score results
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

Game.prototype.ChoosingTimer = function() {
	if (this.timer_seconds == 0) {
		clearInterval(countdownTimer);
		this.turnStartDrawingPhase()
	} else {
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startChoosingTimer = function() {
	this.timer_seconds = this.choosing_duration
	console.log(`Starting choosing timer with duration: ${this.timer_seconds}`)
	countdownTimer = setInterval(this.ChoosingTimer.bind(this), 1000);
}

Game.prototype.DrawingTimer = function() {
	if (this.timer_seconds == 0) {
		clearInterval(countdownTimer);
		this.turnStartEndingPhase()
	} else {
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startDrawingTimer = function() {
	this.timer_seconds = this.drawing_duration
	countdownTimer = setInterval(this.DrawingTimer.bind(this), 1000);
}

// when the turn starts
Game.prototype.turnStart = function(round_id) {

	//get current round object
	current_turn_id = this.rounds[round_id].current_turn_id
	
	// get current turn object and switch the phase to choosing
	this.rounds[round_id].turns[current_turn_id].phase = 'choosing'
	this.startChoosingTimer() // when it ends, call turnStartDrawingPhase()

}

Game.prototype.turnStartDrawingPhase = function() {
	current_turn_id = this.rounds[this.current_round_id].current_turn_id
	this.rounds[this.current_round_id].turns[current_turn_id].phase = 'drawing'
	this.startDrawingTimer() // when it ends, call turnStartDrawingPhase()
}

Game.prototype.turnStartEndingPhase = function() {
	current_turn_id = this.rounds[this.current_round_id].current_turn_id
	this.rounds[this.current_round_id].turns[current_turn_id].phase = 'ending'
	// TODO update scores

	if (current_turn_id == this.rounds[this.current_round_id].turns.length - 1) {
		// on end of the last turn of the last round
		this.roundEnd(this.rounds[this.current_round_id])

	} else {
		this.rounds[this.current_round_id].current_turn_id++;
		this.turnStart(this.current_round_id)
	}
}


Game.prototype.roundEnd = function() {
	if (this.current_round_id == this.max_rounds) {
		this.gameEnd();
	} else {
		this.current_round_id++;
		this.roundStart();
	}
}

Game.prototype.roundStart = function() {
	this.rounds[this.current_round_id] = new Round(this.current_round_id, this.players)
	this.turnStart(this.current_round_id);
}

Game.prototype.gameStart = function() {
	// Start Game from Lobby (pregame stage)
	if (this.phase == 'pregame' && Object.keys(this.players).length > 1 ) {
		// start first round (0)
		this.roundStart()
		this.phase = 'midgame'
	// End the game, displaying 
	}
}

Game.prototype.gameEnd = function() {
	this.phase = 'ending'
	// set winner = player id of winner
	// if only 1 player left in game, winner = the last player left
}

Game.prototype.playerAdd = function(player) {
	if (this.players.length == 0) {
		this.host = player.id
	}
	this.players[player.id] = player; // add new player object to the game object
}

Game.prototype.playerLeave = function(player_id) {
	for (var turn in this.rounds[this.current_round_id].turns) {
		if (turn.artist_id == player_id) {
			delete turn
		}
	}

	delete this.players.player_id // This player is no longer in the game.

	if (Object.keys(this.players).length < 2 && this.phase == 'midgame') {
		this.gameEnd();
	}

}


module.exports = {
	Player,
	Game,
	Round,
	Turn
  }


  