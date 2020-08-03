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

		this.drawing_duration = 10 //seconds
		this.choosing_duration = 20 //seconds
		this.ending_duration = 5
	}
}

class Round {    
	constructor(round_id, players) {
		this.players = players
		this.round_id = round_id;
		this.turns = this.getTurns(this.players);
		this.current_turn_id = 0;
	}
}

Round.prototype.getTurns = function(players) {
	turn_array = [];
	Object.keys(players).forEach(function(id) { 
		// console.log(id)
		turn_array.push(new Turn(id))
		 
	});

	return turn_array;
}

class Turn {
	constructor(artist_id) {
		this.artist_id = artist_id;
		this.phase = 'choosing' // transitions after to drawing, then to finishing (where the points gained for the turn are shown)
		// choosing phase = picking the word, drawing phase = drawing, ending phase = show the score results

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
	io.to(this.game_id).emit('clearCanvas');
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
	console.log(`Starting drawing timer with duration: ${this.timer_seconds}`)
	countdownTimer = setInterval(this.DrawingTimer.bind(this), 1000);
}

Game.prototype.EndingTimer = function() {
	if (this.timer_seconds == 0) {
		clearInterval(countdownTimer);
		var round_id = this.current_round_id
		if (this.rounds[round_id].current_turn_id == (this.rounds[round_id].turns.length) - 1) {
			// on end of the last turn of the last round
			this.roundEnd()
	
		} else {
			this.rounds[round_id].current_turn_id++;
			this.turnStart()
		}
	} else {
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startEndingTimer = function() {
	this.timer_seconds = this.ending_duration
	console.log(`Starting ending timer with duration: ${this.timer_seconds}`)
	countdownTimer = setInterval(this.EndingTimer.bind(this), 1000);
}

// when the turn starts
Game.prototype.turnStart = function() {

	var round_id = this.current_round_id;
	//get current round object
	var turn_id = this.rounds[round_id].current_turn_id
	
	// get current turn object and switch the phase to choosing
	this.rounds[round_id].turns[turn_id].phase = 'choosing'
	this.startChoosingTimer() // when it ends, call turnStartDrawingPhase()

}

Game.prototype.turnStartDrawingPhase = function() {
	var current_round_id = this.current_round_id;
	var current_turn_id = this.rounds[current_round_id].current_turn_id
	this.rounds[current_round_id].turns[current_turn_id].phase = 'drawing'
	this.startDrawingTimer() // when it ends, call turnStartDrawingPhase()
}

Game.prototype.turnStartEndingPhase = function() {
	var current_round_id = this.current_round_id;
	var current_turn_id = this.rounds[current_round_id].current_turn_id
	this.rounds[current_round_id].turns[current_turn_id].phase = 'ending'
	// TODO update scores
	this.startEndingTimer();
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
	this.turnStart();
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
	// set winner = player id of winner
	// if only 1 player left in game, winner = the last player left
	this.phase = 'pregame'
	this.rounds = {}
	this.current_round_id = 1;
	this.timer_seconds = 0;
	this.drawing_duration = 3 //seconds
	this.choosing_duration = 5 //seconds
	this.ending_duration = 3
}

Game.prototype.playerAdd = function(player) {
	if (this.players.length == 0) {
		this.host = player.id
	}
	this.players[player.id] = player; // add new player object to the game object
}

// Game.prototype.playerLeave = function(player_id) {
// 	var round_id = this.current_round_id;
// 	if (this.rounds[round_id]) {
// 		for (var turn in this.rounds[round_id].turns) {
// 			if (turn.artist_id == player_id) {
// 				delete turn
// 			}
// 		}
// 	}
// 	delete this.players.player_id // This player is no longer in the game.

// }


module.exports = {
	Player,
	Game,
	Round,
	Turn
  }


  