require('dotenv').config()
const express = require('express')
const session = require('express-session');
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

async function getRandomWords(word_count) {
	words = []
	for (let i = 0; i < word_count; i++) {
		var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1));
		random_word = wordArray[n]
		let word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`);
		let word_data_json = await word_data.json();

		let word = {word: random_word, link: word_data_json[3][0]}
		
		words.push(word)
	}
	return words;
}

const loadGame = async (request, response) => { // Path: /game/:id

	// If logged in:
    if (request.session.loggedin) {

		username = request.session.username; // Grab username from session.
		var room_id = request.params.id; // Grab room ID from URL path parameters.
		request.session.currentRoom = room_id;

		try {
			let word_count = 3
			word_array = await getRandomWords(word_count) // get words array
			//response.send(word_array)
			word_object = {word_count: word_count, words: word_array};
		} catch (error) {
			console.log(error);
		}
		if (!(games[room_id])) {
			games[room_id] = new Game(room_id, 3)
		}
		var gameData = games[room_id]
		response.render('pages/game', {session: request.session, game: gameData, word_object: word_object}); // Render game EJS template with data from the user's session.
		
    } else {
	// If logged out, redirect back to home with warning alert.
	// alerts attribute is cleared are cleared right after displaying them on the home page.
		request.session.alerts = [['Please login before joining!', 'alert-warning', 'exclamation-triangle']]
        response.redirect('/');
    }
}
const loadAdmin = async (request, response) => { // Path: /game/:id
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

	disconnectMessage = {};

	// Listen for addUserToRoom event from client.
	socket.on('addUserToRoom', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;
		var game_id = session.currentRoom;
		games[game_id].playerAdd(new Player(socket.username));

		socket.join(socket.room_id)
		console.log(`${socket.username} (${socket.id}) joined Room ${socket.room_id}`)

		disconnectMessage = {username: socket.username, content: `${socket.username.capitalize()} has left the game!`, style: 'm-red'}

		message = {username: socket.username, content: socket.username + ' has joined the game!', style: 'm-green'}
		socket.emit('welcome-message', message);
		socket.broadcast.to(socket.room_id).emit('welcome-message', message);

		socket.emit('uiUpdate', games[socket.room_id]);
		socket.broadcast.to(socket.room_id).emit('uiUpdate', games[socket.room_id]);

	});

	socket.on('getUiUpdate', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;

		socket.emit('uiUpdate', games[socket.room_id]);

	});

	socket.on('startGame', (game_id) => {

		games[game_id].gameStart()

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

	//Runs when client disconnects
	socket.on('disconnect', () => {
		var game_id = socket.room_id;
		var user_id = socket.username;
		var round_id = games[game_id].current_round_id

		delete games[game_id].players[user_id];

		if (games[game_id].rounds[round_id]) {
			for (var turn in games[game_id].rounds[round_id].turns) {
				if (turn.artist_id == user_id) {
					delete turn
				}
			}
		}

		if (Object.keys(games[game_id].players).length < 2) {
			games[game_id].gameEnd();
		}

		socket.broadcast.to(game_id).emit('update', games[game_id]);
		//To everyone included itself
		io.emit('disconnect-message', disconnectMessage);
	});
})

