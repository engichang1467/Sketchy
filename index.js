require('dotenv').config()
const express = require('express')
const session = require('express-session');
var randomPictionaryList = require('word-pictionary-list');
const path = require('path');
var favicon = require('serve-favicon');
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');

var pool; 
//   'postgres://postgres:6757@localhost/usr'
// process.env.DATABASE_URL
pool = new Pool ({
	connectionString: process.env.LOCALDB
});

// for heroku deployment:
//const io = require('socket.io')(server);
// must also change socket.js
const io = require('socket.io')(3000);

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
		io.to(this.game_id).emit('updateTimer', this);
		clearInterval(countdownTimer);
		this.turnStartDrawingPhase()
	} else {
		io.to(this.game_id).emit('updateTimer', this);
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
		io.to(this.game_id).emit('updateTimer', this);
		clearInterval(countdownTimer);
		this.turnStartEndingPhase()
	} else {
		io.to(this.game_id).emit('updateTimer', this);
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
		io.to(this.game_id).emit('updateTimer', this);
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
		io.to(this.game_id).emit('updateTimer', this);
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
	io.to(this.game_id).emit('updateSidebarContainers', this);
	io.to(this.game_id).emit('updatePlayerList', this);

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

	
	io.to(this.game_id).emit('updateSidebarContainers', this);
	io.to(this.game_id).emit('updatePlayerList', this);

	message = {username: player.id, content: player.id + ' has joined the game!', style: 'm-green'}
	io.to(this.game_id).emit('welcome-message', message);
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

	io.to(this.game_id).emit('updatePlayerList', this);
	io.to(this.game_id).emit('disconnect-message', message);

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


const auth = require('./authentication')
//const { Player, Game } = require('./gamelogic')




var games = {};
games['1'] = new Game(1, 3)
games['2'] = new Game(2, 3)
games['3'] = new Game(3, 3)


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


const loadGame = (request, response) => { // Path: /game/:id

	// If logged in:
    if (request.session.loggedin) {

		username = request.session.username; // Grab username from session.
		var room_id = request.params.id; // Grab room ID from URL path parameters.
		request.session.currentRoom = room_id;

		if (!(games[room_id])) {
			games[room_id] = new Game(room_id, 3)
		}
		var gameData = games[room_id]
		response.render('pages/game', {session: request.session, game: gameData}); // Render game EJS template with data from the user's session.
		
    } else {
	// If logged out, redirect back to home with warning alert.
	// alerts attribute is cleared are cleared right after displaying them on the home page.
		request.session.alerts = [['Please login before joining!', 'alert-warning', 'exclamation-triangle']]
        response.redirect('/');
    }
}
const loadAdmin = (request, response) => { // Path: /game/:id
	// If logged in:
    if (request.session.loggedin) {
		

		if (request.session.admin) {
			pool.query('SELECT * FROM usr', (error, result) => {
				if (error) throw error;

				var data = result.rows
				response.render('pages/admin',{session: request.session, user_data: data});			
			});
			
		} else {
			request.session.alerts = [[`No Privileges`, 'alert-failure', 'exclamation-triangle']]
			response.redirect('/');
		}			
				
    } else {
	// If logged out, redirect back to home with warning alert.
	// alerts attribute is cleared are cleared right after displaying them on the home page.
		request.session.alerts = [['No Privileges', 'alert-failure', 'exclamation-triangle']]
        response.redirect('/');
    }
}

const app = express()
	module.exports = app
	app.use(session({
		secret: '276isthebest',
		resave: true,
		saveUninitialized: true
	}))
	app.use(express.json())
	app.use(express.urlencoded({extended:false}))
	app.use(express.static(path.join(__dirname, '/public')))
	
	app.set('views', path.join(__dirname, 'views'))
	app.set('view engine', 'ejs')

	app.use(favicon(__dirname + '/public/images/favicon.ico'));

	// Authentication Routes 
	/* Authenticate User */
	app.post('/login', auth.loginUser)
	/* Signup User */
	app.post('/signup', auth.signupUser)

	// Routes 
	/* Home */
	app.get('/', auth.loadHome)
	/* Game */
	app.get('/game/:id', loadGame)

	app.get('/admin', loadAdmin)
	// Start Listening 
	const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`))




String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

io.on('connection', (socket) => {
	console.log(`${socket.id} connected.`)

	// Listen for addUserToRoom event from client.
	socket.on('addUserToRoom', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;
		var game_id = session.currentRoom;

		socket.join(socket.room_id)

		games[game_id].playerAdd(new Player(socket.username));


	});

	socket.on('getUiUpdate', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;

		socket.emit('uiUpdate', games[socket.room_id]);

	});

	socket.on('startGame', (game_id) => {

		games[game_id].gameStart()

	});

	socket.on('chooseWord', (word_chosen_id) => {
		console.log(`server received chooseWord event`)
		games[socket.room_id].chooseWord(word_chosen_id);

	});



	socket.on('mouse', (canvas_data) => {socket.broadcast.to(socket.room_id).emit('receive_mouse', canvas_data.data)});
	
	socket.on('clear', () => {socket.broadcast.emit('clear')});
	socket.on('undo', (stack) => {socket.broadcast.emit('undo',stack)});

	// Listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// Send back the message to all Clients
		message = {username: socket.username, content: msg, style: ''}
		io.to(socket.room_id).emit('message', message);
	});

	socket.on('leaveGame', () => {
		socket.disconnect()
	});


})

io.sockets.on('connection', function (socket) {
	//Runs when client disconnects
	socket.on('disconnect', function() {
		var game_id = socket.room_id;
		var user_id = socket.username;

			games[game_id].playerRemove(user_id)

	});
});

