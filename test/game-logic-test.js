var expect = require('chai').expect;
var app = require('../index');
var io = require('socket.io-client')
var property = {'reconnection delay':  0
, 'reopen delay': 0
, 'force new connection': true}
// const io = require('socket.io')(3000);
var socket_url = 'http://localhost:3000';
var randomPictionaryList = require('word-pictionary-list');

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

		this.timer_seconds = 10;
		this.choosing_duration = 10 //seconds
		this.drawing_duration = 20 //seconds
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
		this.phase = 'waiting' // transitions after to drawing, then to finishing (where the points gained for the turn are shown)
		// choosing phase = picking the word, drawing phase = drawing, ending phase = show the score results
		this.word_list = [];
		this.word_chosen = "";
	}
}

Game.prototype.ChoosingTimer = function() {
	if (this.timer_seconds == 0) {
		// io.to(this.game_id).emit('updateTimer', this);
		clearInterval(countdownTimer);
		this.turnStartDrawingPhase()
	} else {
		// io.to(this.game_id).emit('updateTimer', this);
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startChoosingTimer = function() {
	// io.to(this.game_id).emit('clearCanvas');
	this.timer_seconds = this.choosing_duration
	console.log(`Starting choosing timer with duration: ${this.timer_seconds}`)
	countdownTimer = setInterval(this.ChoosingTimer.bind(this), 1000);
}

Game.prototype.DrawingTimer = function() {
	if (this.timer_seconds == 0) {
		// io.to(this.game_id).emit('updateTimer', this);
		clearInterval(countdownTimer);
		this.turnStartEndingPhase()
	} else {
		// io.to(this.game_id).emit('updateTimer', this);
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
		// io.to(this.game_id).emit('updateTimer', this);
		clearInterval(countdownTimer);
		var round_id = this.current_round_id
		if (this.rounds[round_id].current_turn_id == (this.rounds[round_id].turns.length) - 1) {
			// on end of the last turn of the last round
			this.roundEnd()
	
		} else {

			this.rounds[round_id].current_turn_id++; // set current turn # to next turn #

			// start the next turn
			this.turnStart()
		}
	} else {
		// io.to(this.game_id).emit('updateTimer', this);
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startEndingTimer = function() {
	this.timer_seconds = this.ending_duration
	console.log(`Starting ending timer with duration: ${this.timer_seconds}`)
	countdownTimer = setInterval(this.EndingTimer.bind(this), 1000);
}

// when the turn starts
Game.prototype.turnStart = async function() {

	var round_id = this.current_round_id;
	//get current round object
	var turn_id = this.rounds[round_id].current_turn_id
	
	await this.createWordList(3);

	// get current turn object and switch the phase to choosing
	this.rounds[round_id].turns[turn_id].phase = 'choosing'

	for (var player in this.players) { // for each player

		// otherwise the player is a guesser.
		this.players[player].current_role = 'guesser'

		// if player is the artist for the next turn
		if (player == this.rounds[round_id].turns[turn_id].artist_id) {
			// then set their role to artist
			this.players[player].current_role = 'artist'
			
		}

	}

	// Send event to client to update the sidebar UI
	// io.to(this.game_id).emit('updateSidebarContainers', this);
	// io.to(this.game_id).emit('updatePlayerList', this);

	// TODO let client run this.chooseWord(1);

	this.startChoosingTimer(); // when it ends, call turnStartDrawingPhase()
	
}

Game.prototype.turnStartDrawingPhase = function() {
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	this.rounds[round_id].turns[turn_id].phase = 'drawing'
	this.startDrawingTimer() // when it ends, call turnStartDrawingPhase()
}

Game.prototype.turnStartEndingPhase = function() {
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	this.rounds[round_id].turns[turn_id].phase = 'ending'
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

	
	// io.to(this.game_id).emit('updateSidebarContainers', this);
	// io.to(this.game_id).emit('updatePlayerList', this);

	message = {username: player.id, content: player.id + ' has joined the game!', style: 'm-green'}
	// io.to(this.game_id).emit('welcome-message', message);
}

Game.prototype.playerRemove = function(player_id) {

	var round_id = this.current_round_id;
	var message = {username: this.players[player_id].id, content: this.players[player_id].id + ` has left the game!`, style: 'm-red'}

	// if leaving mid-game
	if (this.phase == 'midgame') {


		// if one of last two players leaves: 
		if (Object.keys(this.players).length <= 2) {
			this.gameEnd(); // then end the game
		}

		// otherwise just remove them from the players list
		delete this.players[player_id] // This player is no longer in the game.

		if (this.rounds[round_id]) {
			var i = 0;
			for (var turn in this.rounds[round_id].turns) {
				if (turn.artist_id == player_id) {
					delete this.rounds[round_id].turns[i]
				}
				i++;
			}
		}
	} else {
		delete this.players[player_id]
	}

	// io.to(this.game_id).emit('updatePlayerList', this);
	// io.to(this.game_id).emit('disconnect-message', message);

}

const wordListPath = require('word-list');
const fs = require('fs');
const fetch = require("node-fetch");
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');

async function getWord() {
	// Getting the wiki link for the first word
	var word = randomPictionaryList(1);
	const word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${word}`)
	const word_data_json = await word_data.json()
	const link = await word_data_json[3][0]
	// Getting the definition for the first word
	const word_def_data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
	const word_def_data_json = await word_def_data.json()
	const word_def = await word_def_data_json[0]['meanings'][0]['definitions'][0]["definition"]
	// Put into an object
	const output = {word: word[0], definition: word_def, link: link}
	// console.log(output);
	return output;
	
}

async function getWords(word_count){
	words = []
	for (let i = 0; i < word_count; i++) {
		try {
			word = await getWord();
			words.push(word);
		} catch {
			console.log('Error getting word')
			i--;
		}
	}
	return words;
}



Game.prototype.chooseWord = function(word_id){
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id;
	this.rounds[round_id].turns[turn_id].word_chosen = this.rounds[round_id].turns[turn_id].word_list[word_id].word
	console.log(`Chosen Word: ${this.rounds[round_id].turns[turn_id].word_chosen}`)
}

Game.prototype.createWordList = async function(word_count){
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id;
	this.rounds[round_id].turns[turn_id].word_list = await getWords(word_count);
	console.log(`Word List: ${JSON.stringify(this.rounds[round_id].turns[turn_id].word_list)}`);
}
var games = {};
games['1'] = new Game(1, 3)
games['2'] = new Game(2, 3)
games['3'] = new Game(3, 3)


var socket1, socket2, socket3;

// before(function(done) {

//     socket1 = io.connect(socket_url,property);
//     socket1.on('connect',function(){
//         socket2 = io.connect(socket_url.property);
//         socket2.on('connect',function(){
//             socket3 = io.connect(socket_url.property);
//             socket3.on('connect', function(){
//                 var session = {username: "bob", currentRoom: 1}
//                 socket1.emit('addUserToRoom',{session});
//                 var session = {username: "joe", currentRoom: 1}
//                 socket2.emit('addUserToRoom',{session});
//                 var session = {username: "pop", currentRoom: 1}
//                 socket3.emit('addUserToRoom',{session});
//             })
//         })
//     })
//     setTimeout(done(),100);
//   });


// after(function(done){
//     socket1.disconnect();
//     socket2.disconnect();
//     socket3.disconnect();
//     done();
// })

describe("Checking creation of game",function(done){
    this.timeout(5000);
    it("Checks if timer and rounds are created",function(done){
        //2 player joins room 1 would call this function
        games['1'].playerAdd(new Player('tester1'));
        games['1'].playerAdd(new Player('tester2'));
        //See if the rounds are empty at all
        expect(games['1'].rounds).to.deep.equal({});
        //See if the timer is equal to 10 since game hasn't started (default value)
        expect(games['1'].timer_seconds).to.be.equal(10); 
        games['1'].gameStart();
        expect(games['1'].rounds).to.deep.not.equal({});
        games['1'].startDrawingTimer();
        // This should equal 20 when drawing timer starts
        expect(games['1'].timer_seconds).to.be.equal(20); 
        

        setTimeout(()=>{
            //THis should equal 19 after one second
            expect(games['1'].timer_seconds).to.be.equal(19); 
            games['1'].start
            done()
        },1010)
        
    })
})

//I need to double check how to do this

// describe("Tests the user choosing a word",function(done){

//     it("User will choose a word",function(done){
//         var testGame = new Game(1,2);
//         testGame.playerAdd(new Player('tester1'));
//         testGame.playerAdd(new Player('tester2'));
//         testGame.gameStart();
//         testGame.chooseWord(1);
//         var turn_id = testGame.rounds[round_id].current_turn_id;
//         expect(testGame.rounds[current_round_id].word_chosen).to.be.equal(game.rounds[current_round_id].turns[turn_id].word_list[1].word)
//     })
// })





