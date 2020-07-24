const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 80

const auth = require('./authentication')

const wordListPath = require('word-list');
const fs = require('fs');
const fetch = require("node-fetch");
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');

// function getRandWords()
// {
// 	var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1))
//     return wordArray[n]
// }

async function getRandomWords(word_count) {
	words = []
	for (let i = 0; i < word_count; i++) {
		var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1));
		random_word = wordArray[n]
		let word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`);
		let word_data_json = await word_data.json();

		let word = {word: random_word, link: word_data_json[3][1]}
		
		words.push(word)
	}
	return words;
}


const loadGame = (request, response) => { // Path: /game/:id

	username = request.session.username; // Grab username from session.
	room_id = request.params.id; // Grab room ID from URL path parameters.
	request.session.currentRoom = room_id;

	try {
		let word_count = 3
		let word_array = getRandomWords(word_count) // get words array
		words = {word_count: word_count, words: word_array};
	} catch (error) {
		console.log(error);
	}

	// If logged in:
    if (request.session.loggedin) {
		response.render('pages/game', {session: request.session, words: words}); // Render game EJS template with data from the user's session.
		
    } else {
	//If logged out, redirect back to home with warning alert.
        response.render('pages/home', {alerts: [['Please login before joining!', 'alert-warning', 'exclamation-triangle']], session});
    }
}

const initRooms = (roomCount) => {
    var rooms = []
    for (i = 0; i < roomCount; i++) {
        rooms[i] = 'room' + (i+1).toString;
    }
    return rooms;
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


	// Start Listening 
	const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`))



const io = require('socket.io')(server);


io.on('connection', (socket) => {
	console.log(`${socket.id} connected.`)

	// Listen for addUserToRoom event from client.
	socket.on('addUserToRoom', ({session}) => {
		
		socket.username = session.username;
		socket.room_id = session.currentRoom;

		socket.join(socket.room_id)
		console.log(`${socket.username} (${socket.id}) joined Room ${socket.room_id}`)

		message = {username: socket.username, content: 'Welcome ' + socket.username + '!'}
		socket.emit('message', message); //To single client
		//Broadcast when a user connects: broadcast all clients except user itself
		joinedMessage = {username: socket.username, content: `${socket.username} has joined the game.`}
		socket.broadcast.to(socket.room_id).emit('message', message);

	});

	socket.on('mouse', (data) => {socket.broadcast.emit('mouse', data)});
	socket.on('clear', () => {socket.broadcast.emit('clear')});
	socket.on('undo', (stack) => {socket.broadcast.emit('undo',stack)});

	// Listen for chatMessage
	socket.on('chatMessage', (msg) => {
		// Send back the message to all Clients
		message = {username: socket.username, content: msg}
		io.to(socket.room_id).emit('message', message);
	});
	//Runs when client disconnects
	socket.on('disconnect', ()=> {
		disconnectMessage = {username: socket.username, content: `${socket.username} has left the game!`}
		//To everyone included itself
		io.emit('message', disconnectMessage);
	});
})

