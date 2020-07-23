const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000
const auth = require('./authentication')


const loadGame = (request, response) => { // Path: /game/:id

	username = request.session.username; // Grab username from session.
	room_id = request.params.id; // Grab room ID from URL path parameters.
	request.session.currentRoom = room_id;

	// If logged in:
    if (request.session.loggedin) {
		response.render('pages/game', {session: request.session}); // Render game EJS template with data from the user's session.
		
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

