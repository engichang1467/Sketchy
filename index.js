const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000
const auth = require('./authentication')
const fs = require('fs');
const fetch = require("node-fetch");

// Returns the path to the word list which is separated by `\n`
const wordListPath = require('word-list');

const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');

function getRandWords()
{
	var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1))
    return wordArray[n]
}

/* reference on implmenting the urban dictionary api: 
   https://rapidapi.com/community/api/urban-dictionary */

// function get_definition(word) {
// 	var req = unirest("GET", "https://mashape-community-urban-dictionary.p.rapidapi.com/define");
// 	req.headers({
// 		"x-rapidapi-host": "mashape-community-urban-dictionary.p.rapidapi.com",
// 		"x-rapidapi-key": "d5e2d819d4msh7bcc051da537e83p1d5625jsn81ee7cc88779",
// 		"useQueryString": true
// 	});
	
// 	req.query({
// 		"term": word
// 	});
	
// 	req.end(function (result1) {
// 		if (result1.error) throw new Error(result1.error);
// 		definitions.push(result1.body.list[0].definition);
// 	});
// }	

// for (let i = 0; i < 3; i++) {
// 	get_definition(words[i]); 
// }

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

	/* Word */ .get('/choose_word', async (req, res) => {
													try {
														var data0 = getRandWords()
														const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data0}`);
														const json = await response.json();
														const dataInfo0 = await json[3][0]

														var data1 = getRandWords()
														const response1 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data1}`);
														const json1 = await response1.json();
														const dataInfo1 = await json1[3][0]

														var data2 = getRandWords()
														const response2 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data2}`);
														const json2 = await response2.json();
														const dataInfo2 = await json2[3][0]
													
														res.render('pages/word_list.ejs', {data0: data0, data1: data1, data2: data2, dataInfo0: dataInfo0, dataInfo1: dataInfo1, dataInfo2: dataInfo2})
													} catch (error) {
														console.log(error);
													}
													})

	// Start Listening 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))
