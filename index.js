const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000
const auth = require('./authentication')
var randWords = require('random-words')
var unirest = require("unirest");

function words3(){
	return randWords(3)
}

words = []
definitions = []
words = words3()

/* reference on implmenting the urban dictionary api: 
   https://rapidapi.com/community/api/urban-dictionary */

function get_definition(word) {
	var req = unirest("GET", "https://mashape-community-urban-dictionary.p.rapidapi.com/define");
	req.headers({
		"x-rapidapi-host": "mashape-community-urban-dictionary.p.rapidapi.com",
		"x-rapidapi-key": "d5e2d819d4msh7bcc051da537e83p1d5625jsn81ee7cc88779",
		"useQueryString": true
	});
	
	req.query({
		"term": word
	});
	
	req.end(function (result1) {
		if (result1.error) throw new Error(result1.error);
		definitions.push(result1.body.list[0].definition);
	});
}	

for (let i = 0; i < 3; i++) {
	get_definition(words[i]); 
}

express()
	.use(session({
		secret: '276isthebest',
		resave: true,
		saveUninitialized: true
	}))
	.use(express.json())
	.use(express.urlencoded({extended:false}))
	.use(express.static(path.join(__dirname, 'public')))
	.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'ejs')

	// Authentication Routes 
	/* Authenticate User */ .post('/login', auth.loginUser)
	/* Signup User */       .post('/signup', auth.signupUser)

	// Routes 
	/* Home */ .get('/', auth.loadHome)
	/* Game */ .get('/game', (req, res) => res.render('pages/game'))
	/* Word */ .get('/choose_word', (req, res) => {
													var data = words3()
													var data0 = data[0]
													var data1 = data[1]
													var data2 = data[2]
													res.render('pages/word_list.ejs', {data0: data0, data1: data1, data2: data2})
													})

	// Start Listening 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))
