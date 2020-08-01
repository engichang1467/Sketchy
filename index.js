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

const auth = require('./authentication')
const { Player, Game } = require('./gamelogic')




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

	// for heroku deployment:
	//const io = require('socket.io')(server);
	// must also change socket.js
	const io = require('socket.io')(3000);


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

