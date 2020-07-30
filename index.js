const express = require('express')
const session = require('express-session');
const path = require('path');
var favicon = require('serve-favicon');
const PORT = process.env.PORT || 5000

const auth = require('./authentication')

var randomPictionaryList = require('word-pictionary-list'); 

const { Player, Game, Round, Turn } = require('./gamelogic')

var game = [
	new Game(1, 3), // Game 1 - games[1]
	new Game(2, 3), // Game 2 - games[2]
	new Game(3, 3), // Game 3 - games[3]
]

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
		room_id = request.params.id; // Grab room ID from URL path parameters.

		

		request.session.currentRoom = room_id;

		try {
			let word_count = 3
			word_array = await getRandomWords(word_count) // get words array
			//response.send(word_array)
			word_object = {word_count: word_count, words: word_array};
		} catch (error) {
			console.log(error);
		}
		var gameData = game[room_id]
		response.render('pages/game', {session: request.session, game: gameData, word_object: word_object}); // Render game EJS template with data from the user's session.
		
    } else {
	// If logged out, redirect back to home with warning alert.
	// alerts attribute is cleared are cleared right after displaying them on the home page.
		request.session.alerts = [['Please login before joining!', 'alert-warning', 'exclamation-triangle']]
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

	/* Word */ .get('/choose_word', async (req, res) => {
													try {
														var dataList = randomPictionaryList(3)
														// var data0 = getRandWords()
														var data0 = dataList[0]
														const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data0}`);
														const json = await response.json();
														const dataInfo0 = await json[3][0]

														// var data1 = getRandWords()
														var data1 = dataList[1]
														const response1 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data1}`);
														const json1 = await response1.json();
														const dataInfo1 = await json1[3][0]

														// var data2 = getRandWords()
														var data2 = dataList[2]
														const response2 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data2}`);
														const json2 = await response2.json();
														const dataInfo2 = await json2[3][0]
													
														res.render('pages/word_list.ejs', {data0: data0, data1: data1, data2: data2, dataInfo0: dataInfo0, dataInfo1: dataInfo1, dataInfo2: dataInfo2})
													} catch (error) {
														console.log(error);
													}
													})

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

		game[socket.room_id].playerAdd(new Player(username));

		socket.join(socket.room_id)
		console.log(`${socket.username} (${socket.id}) joined Room ${socket.room_id}`)

		disconnectMessage = {username: socket.username, content: `${socket.username.capitalize()} has left the game!`, style: 'm-red'}

		message = {username: socket.username, content: socket.username.capitalize() + ' has joined the game!', style: 'm-green'}
		socket.emit('welcome-message', message);
		socket.broadcast.to(socket.room_id).emit('welcome-message', message);

		socket.emit('update', game[socket.room_id]);
		socket.broadcast.to(socket.room_id).emit('update', game[socket.room_id]);

	});

	socket.on('getUpdate', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;

		socket.emit('update', game[socket.room_id]);

	});



	socket.on('mouse', (data) => {socket.broadcast.emit('mouse', data)});
	socket.on('clear', () => {socket.broadcast.emit('clear')});
	socket.on('undo', (stack) => {socket.broadcast.emit('undo',stack)});

	// Listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// Send back the message to all Clients
		message = {username: socket.username, content: msg, style: ''}
		io.to(socket.room_id).emit('message', message);
	});
	//Runs when client disconnects
	socket.on('disconnect', ()=> {
		game[socket.room_id].playerRemove(socket.username);
		socket.broadcast.to(socket.room_id).emit('update', game[socket.room_id]);
		//To everyone included itself
		io.emit('disconnect-message', disconnectMessage);
	});
})

