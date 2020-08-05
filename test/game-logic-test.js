var expect = require('chai').expect;
var app = require('../index');
var io = require('socket.io-client')
var property = {'reconnection delay':  0
, 'reopen delay': 0
, 'force new connection': true}
// const io = require('socket.io')(3000);
var socket_url = 'http://localhost:3000';

//Test functions start on line 197

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

var games = {};


var socket1, socket2, socket3;

before(function(done) {
    games['1'] = new Game(1, 3)
    games['2'] = new Game(2, 3)
    games['3'] = new Game(3, 3)
    socket1 = io.connect(socket_url,property);
    socket1.on('connect',function(){
        socket2 = io.connect(socket_url.property);
        socket2.on('connect',function(){
            socket3 = io.connect(socket_url.property);
            socket3.on('connect', function(){
                var session = {username: "bob", currentRoom: 1}
                socket1.emit('addUserToRoom',{session});
                var session = {username: "joe", currentRoom: 1}
                socket2.emit('addUserToRoom',{session});
                var session = {username: "pop", currentRoom: 1}
                socket3.emit('addUserToRoom',{session});
                done();
            })
        })
    })
    setTimeout(done(),100);
  });


after(function(done){
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();
    done();
})

describe("Checking creation of game",function(done){
    
    it("Checks if timer and rounds are created",function(done){
        //2 player joins room 1 would call this function
        games['1'].playerAdd(new Player('tester1'));
        games['1'].playerAdd(new Player('tester2'));
        console.log(games['1'])
        //See if the rounds are empty at all
        expect(games['1'].rounds).to.deep.equal({});
        //See if the timer is equal to 0 since game hasn't started
        expect(games['1'].timer_seconds).to.be.equal(0); 
        games['1'].gameStart();
        expect(games['1'].rounds).to.deep.not.equal({});

        //This should equal 20 since game starts
        expect(games['1'].timer_seconds).to.be.equal(20); 


        setTimeout(()=>{
            expect(games['1'].timer_seconds).to.be.equal(19); 
            done()
        },1000)
        
    })
})



