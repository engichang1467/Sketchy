var expect = require('chai').expect;
var app = require('../index');
var io = require('socket.io-client')
var property = {'reconnection delay':  0
, 'reopen delay': 0
, 'force new connection': true}
var socket_url = 'http://localhost:3000';
var randomPictionaryList = require('word-pictionary-list');

// const { Player } = require("../gamelogic")

//Test functions start on line 427
var intervals = {}

// for heroku deployment:
//const io = require('socket.io')(server);
// must also change socket.js

class Player {
	constructor(player_id) {
		this.id = player_id
		this.current_role = 'guesser' // default role
		this.score = 0 // placeholder
		this.place = 'gold' // placeholder
		this.guessed_correctly_this_turn = false;
	}	
}

class Game {
	constructor(game_id, max_rounds) {
		this.game_id = game_id;
		this.phase = 'pregame' // midgame, 
		this.players = {/* player object keys */};
		this.rounds = {}
		this.max_rounds = max_rounds;
		this.current_round_id = 1;

		this.timer_seconds = 10;

		this.choosing_duration = 15 //seconds
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
		this.word_chosen_id;
		this.points = []
	}
}

Game.prototype.FindWinnerTest = function() 
{
    var player_list = Object.keys(this.players)
    var highest_score = 0
    var winner = ''
    // console.log(player_list)
    player_list.forEach(i => {
        // console.log(i)
        if (this.players[i].score > highest_score){
            highest_score = this.players[i].score
            winner = i
        }
    })
    return winner
}

Game.prototype.ChoosingTimer = function() {
	if (this.timer_seconds == 0) {
		var round_id = this.current_round_id;
		var turn_id = this.rounds[round_id].current_turn_id
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);

		if (this.rounds[round_id].turns[turn_id].word_chosen == '') {
			// console.log(`choosing random word`)
			this.chooseRandomWord();
		}

		clearInterval(intervals.choosingCountdownTimer);
		this.turnStartDrawingPhase()
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateSidebarContainers', emit_data);

	} else {
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);
		this.timer_seconds = this.timer_seconds - 1;
	}
}
Game.prototype.startChoosingTimer = function() {
	// io.to(this.game_id).emit('clearCanvas');
	this.timer_seconds = this.choosing_duration
	// console.log(`Starting choosing timer with duration: ${this.timer_seconds}`)
	intervals.choosingCountdownTimer = setInterval(this.ChoosingTimer.bind(this), 1000);
}

Game.prototype.DrawingTimer = function() {
	if (this.timer_seconds == 0) {
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);
		clearInterval(intervals.drawingCountdownTimer);
		this.turnStartEndingPhase()
	} else {
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startDrawingTimer = function() {
	this.timer_seconds = this.drawing_duration
	// console.log(`Starting drawing timer with duration: ${this.timer_seconds}`)
	intervals.drawingCountdownTimer = setInterval(this.DrawingTimer.bind(this), 1000);
}

Game.prototype.EndingTimer = function() {
	if (this.timer_seconds == 0) {
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);

		this.addTurnPointsToPlayers();

		clearInterval(intervals.endingCountdownTimer);
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
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateTimer', emit_data);
		this.timer_seconds = this.timer_seconds - 1;
	}
}

Game.prototype.startEndingTimer = function() {
	this.timer_seconds = this.ending_duration
	// console.log(`Starting ending timer with duration: ${this.timer_seconds}`)
	intervals.endingCountdownTimer = setInterval(this.EndingTimer.bind(this), 1000);
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
		this.players[player].guessed_correctly_this_turn = false;

		// if player is the artist for the next turn
		if (player == this.rounds[round_id].turns[turn_id].artist_id) {
			// then set their role to artist
			this.players[player].current_role = 'artist'
			
		}

	}

	


	// Send event to client to update the sidebar UI
	var emit_data = JSON.stringify(this)
	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);
	// io.to(this.game_id).emit('updatePlayerList', emit_data);

	// TODO let client run this.chooseWord(1);

	this.startChoosingTimer(); // when it ends, call turnStartDrawingPhase()
	
}
//Test version of turnStart so that we can avoid front end parts
Game.prototype.turnStartTest = async function() {

	var round_id = this.current_round_id;
	//get current round object
	var turn_id = this.rounds[round_id].current_turn_id
	
	await this.createWordListTest(1);

	// get current turn object and switch the phase to choosing
	this.rounds[round_id].turns[turn_id].phase = 'choosing'

	for (var player in this.players) { // for each player

		// otherwise the player is a guesser.
		this.players[player].current_role = 'guesser'
		this.players[player].guessed_correctly_this_turn = false;

		// if player is the artist for the next turn
		if (player == this.rounds[round_id].turns[turn_id].artist_id) {
			// then set their role to artist
			this.players[player].current_role = 'artist'
			
		}

	}
	this.startChoosingTimer(); // when it ends, call turnStartDrawingPhase()
	
}

Game.prototype.turnStartDrawingPhase = function() {

	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	this.rounds[round_id].turns[turn_id].phase = 'drawing'

	var emit_data = JSON.stringify(this)
	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);
	// io.to(this.game_id).emit('updatePlayerList', emit_data);

	this.startDrawingTimer() // when it ends, call turnStartDrawingPhase()


}

Game.prototype.turnStartEndingPhase = function() {
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	this.rounds[round_id].turns[turn_id].phase = 'ending'

	this.startEndingTimer();
}


Game.prototype.roundEnd = function() {
	if (this.current_round_id == this.max_rounds) {
		this.phase = 'ending'

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
//Test version of round start to avoid front end parts
Game.prototype.roundStartTest = function() {
	this.rounds[this.current_round_id] = new Round(this.current_round_id, this.players)
	this.turnStartTest();
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
//Test version of to avoid front end parts
Game.prototype.gameStartTest = function() {
	// Start Game from Lobby (pregame stage)
	if (this.phase == 'pregame' && Object.keys(this.players).length > 1 ) {
		// start first round (0)
		this.roundStartTest()
		this.phase = 'midgame'
	// End the game, displaying 
	}
}

Game.prototype.gameEnd = function() {
	// set winner = player id of winner
	// if only 1 player left in game, winner = the last player left
	for (let i = 0; i < Object.keys(intervals).length; i++) {
		clearInterval(intervals[Object.keys(intervals)[i]])
	}
	
	this.phase = 'pregame'
	this.rounds = {}
	this.current_round_id = 1;
	this.timer_seconds = 15;

	var emit_data = JSON.stringify(this)
	// io.to(this.game_id).emit('updatePlayerList', emit_data);
	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);

}

Game.prototype.playerAdd = function(player) {
	if (this.players.length == 0) {
		this.host = player.id
	}
	this.players[player.id] = player; // add new player object to the game object

	var emit_data = JSON.stringify(this)
	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);
	// io.to(this.game_id).emit('updatePlayerList', emit_data);

	message = {username: player.id, content: player.id + ' has joined the game!', style: 'm-green'}
	// io.to(this.game_id).emit('welcome-message', message);
}

Game.prototype.playerRemove = function(player_id) {

	
	var message = {username: this.players[player_id].id, content: this.players[player_id].id + ` has left the game!`, style: 'm-red'}

	// if leaving mid-game
	if (this.phase == 'midgame') {
		var round_id = this.current_round_id;
		var turn_id = this.rounds[round_id].current_turn_id
		// if one of last two players leaves: 
		if (Object.keys(this.players).length <= 2) {
			this.gameEnd()
			delete this.players[player_id] // This player is no longer in the game.
		} else {
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

		}
		
	} else {

		delete this.players[player_id]
	}
	var emit_data = JSON.stringify(this)
	// io.to(this.game_id).emit('updatePlayerList', emit_data);
	// io.to(this.game_id).emit('disconnect-message', message);
	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);

}


const fetch = require("node-fetch");

async function getWord() {
	// Getting the wiki link for the word
	var word = randomPictionaryList(1);
	const word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${word}`)
	const word_data_json = await word_data.json()
	const link = await word_data_json[3][0]
	// Getting the definition for the word
	const word_def_data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
	const word_def_data_json = await word_def_data.json()
	const word_def = await word_def_data_json[0]['meanings'][0]['definitions'][0]["definition"]
	// Getting the image for the word
	var src = '';
	const word_image_data = await fetch(`https://en.wikipedia.org/w/api.php?action=query&pilicense=any&format=json&prop=pageimages&pithumbsize=500&generator=search&gsrsearch=${word}&gsrlimit=15`)
	const word_image_data_json = await word_image_data.json()

	

	//for each page of images in the result
	if (Object.keys(word_image_data_json.query.pages).length > 0) {
		for (let i = 0; i < Object.keys(word_image_data_json.query.pages).length; i++) {
			const PageKey = Object.keys(word_image_data_json.query.pages)[i]
			if(word_image_data_json.query.pages[PageKey].thumbnail.source) {
				src = word_image_data_json.query.pages[PageKey].thumbnail.source
				break
			}
		}
	}
	
	// console.log(src)
	
	// Put into an object
	const output = {word: word[0].toLowerCase(), definition: word_def, link: link, src: src}
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
			// console.log('Error getting word, fetching another...')
			i--;
		}
	}
	return words;
}
// function checkWord(word,game){

// 	if(word == game.rounds['1'].turns[0].word_chosen){
// 		return true;
// 	}
// 	else{
// 		return false;
// 	}
// }
async function getWordTest() {
	// Getting the wiki link for the first word
	var word = "A";
	const word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${word}`)
	const word_data_json = await word_data.json()
	const link = await word_data_json[3][0]
	// Getting the definition for the first word
	const word_def_data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
	const word_def_data_json = await word_def_data.json()
	const word_def = await word_def_data_json[0]['meanings'][0]['definitions'][0]["definition"]

	// Getting the image for the word
	var src = '';
	const word_image_data = await fetch(`https://en.wikipedia.org/w/api.php?action=query&pilicense=any&format=json&prop=pageimages&pithumbsize=500&generator=search&gsrsearch=${word}&gsrlimit=15`)
	const word_image_data_json = await word_image_data.json()
	

	//for each page of images in the result
	if (Object.keys(word_image_data_json.query.pages).length > 0) {
		for (let i = 0; i < Object.keys(word_image_data_json.query.pages).length; i++) {
			const PageKey = Object.keys(word_image_data_json.query.pages)[i]
			if(word_image_data_json.query.pages[PageKey].thumbnail.source) {
				src = word_image_data_json.query.pages[PageKey].thumbnail.source
				break
			}
		}
	}
	
	// console.log(src)

	// Put into an object
	const output = {word: word[0], definition: word_def, link: link, src: src}
	// console.log(output);
	return output;
	
}

async function getWordsTest(word_count){
	words = []
	for (let i = 0; i < word_count; i++) {
		try {
			word = await getWordTest();
			words.push(word);
		} catch {
			// console.log('Error getting word, fetching another...')
			i--;
		}
	}
	return words;
}



Game.prototype.chooseWord = function(word_chosen_id) {
	
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id

	// console.log(word_chosen_id)
	

	this.rounds[round_id].turns[turn_id].word_chosen_id = word_chosen_id;
	this.rounds[round_id].turns[turn_id].word_chosen = this.rounds[round_id].turns[turn_id].word_list[word_chosen_id].word
	var emit_data = JSON.stringify(this)

	// io.to(this.game_id).emit('updateSidebarContainers', emit_data);

	this.timer_seconds = 0

	// console.log(`Chosen Word: ${this.rounds[round_id].turns[turn_id].word_list[word_chosen_id].word}`)

}
Game.prototype.chooseWordTest = function(word_id){

    //Altered so that it doesn't require the front-end part
    var round_id = this.current_round_id;
    var turn_id = this.rounds[round_id].current_turn_id;
    this.rounds[round_id].turns[turn_id].word_chosen = "apple"

    // console.log(this.rounds[round_id].turns[turn_id].word_list[1])
    // console.log(`Chosen Word: ${this.rounds[round_id].turns[turn_id].word_chosen}`)
}


// Game.prototype.chooseRandomWord = function() {
// 	var round_id = this.current_round_id;
// 	var turn_id = this.rounds[round_id].current_turn_id
// 	var word_count = this.rounds[round_id].turns[turn_id].word_list.length
// 	var word_id = Math.floor(Math.random() * ((word_count-1) - 0 + 1))
	
// 	this.rounds[round_id].turns[turn_id].word_chosen = this.rounds[round_id].turns[turn_id].word_list[word_id].word
// 	this.rounds[round_id].turns[turn_id].word_chosen_id = word_id;

// 	var emit_data = JSON.stringify(this)
// 	io.to(this.game_id).emit('updateSidebarContainers', emit_data);

// 	console.log(`Randomly Chosen Word: ${this.rounds[round_id].turns[turn_id].word_list[word_id].word}`)
// }


Game.prototype.createWordList = async function(word_count){
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id;
	this.rounds[round_id].turns[turn_id].word_list = await getWords(word_count);
	// console.log(`Word List: ${JSON.stringify(this.rounds[round_id].turns[turn_id].word_list)}`);
}

//Test version of createWordList to avoid front end parts.
//Retreive words tests are part of the word-list-functions
Game.prototype.createWordListTest = async function(word_count){
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id;
	this.rounds[round_id].turns[turn_id].word_list = await getWordsTest(word_count);
	// console.log(`Word List: ${JSON.stringify(this.rounds[round_id].turns[turn_id].word_list)}`);
}

Game.prototype.addPointsForGuess = function (username) {

	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	if (!(this.rounds[round_id].turns[turn_id].points).includes(username)) {
		this.rounds[round_id].turns[turn_id].points.push(username)
		this.players[username].guessed_correctly_this_turn = true;
		var emit_data = JSON.stringify(this)
		// io.to(this.game_id).emit('updateSidebarContainers', emit_data);
		return 1;
	} else {
		return 0;
	}
}


Game.prototype.addTurnPointsToPlayers = function () {
	var round_id = this.current_round_id;
	var turn_id = this.rounds[round_id].current_turn_id
	var points = this.rounds[round_id].turns[turn_id].points
	for(var i = 0; i < points.length; i++) {

		var username = points[i]
		this.players[username].score += (Math.ceil(400/(i+1)))

	}

}

function checkWord(word,game){

	if(word == game.rounds['1'].turns[0].word_chosen){
		return true;
	}
	else{
		return false;
	}
}

var games = {};
games['1'] = new Game(1, 3)
games['2'] = new Game(2, 3)
games['3'] = new Game(3, 3)


// /**
//  * 
// Add and record points for guesser(s) based on how fast they have guessed the word

// User is currently in a game

// When a player guesses the right word, they will receive points for that word based on a point system and the scoreboard will be updated

// When a user guesses

// Inside “game-logic.js”


// Determine the winner of the game

// User

// User is currently in a game

// When the game ends, the winner (player with highest points) will be announced

// When the game ends, the person with the highest points should be declared the winner

// Inside “game-logic.js”

//  */

describe("Add and record points for guesser(s) based on how fast they have guessed the word", function(done){
    var socket1
    var property = {'reconnection delay':  0
    , 'reopen delay': 0
    , 'force new connection': true}
    var socket_url = 'http://localhost:3000';
    var testGame = new Game(1,2)
    it("Users will be acknowledged to get the correct answer and points function will be true", function(done){
        socket1 = io.connect(socket_url, property)

        socket1.on('message', function(msg){
            // sth
            // console.log("Hello Ian Im here")
            if (checkWord(msg.content, testGame)){
                // 
                expect(testGame.addPointsForGuess("tester1")).to.be.equal(1)
                socket1.disconnect()
                done()
            }
        })

        socket1.on('connect', function(done){
            // sth
            var session = {username: "tester1", currentRoom: 3}
            socket1.emit('addUserToRoom',{session})
            
            testGame.playerAdd(new Player('tester1'))
            testGame.playerAdd(new Player('tester2'))
            testGame.gameStartTest()
            setTimeout(()=>{
                testGame.chooseWordTest('apple'); 
            },20)
            setTimeout(()=>{
                // console.log('Im here now Ian')
                var msg = 'apple'
                socket1.emit('chatMessageTest',msg)
            },50)
        })

    })
    // add 150 points to a user
})

describe("Determine the winner of the game", function(done){
    var testGame = new Game(1,2)
    it("Determine the winner of the game of these 2 players", function(done){
        testGame.playerAdd(new Player('tester1'))
        testGame.playerAdd(new Player('tester2'))
        testGame.players['tester1'].score = 200
        testGame.players['tester2'].score = 300
        var winner = testGame.FindWinnerTest()
        setTimeout(() => {
            expect(winner).to.be.equal('tester2')
        }, 70)
        done()
    })
})



