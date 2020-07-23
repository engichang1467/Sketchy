const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000
const auth = require('./authentication')
// const { getRandWords} = require('./wikiDictionary')
const fs = require('fs');

// Returns the path to the word list which is separated by `\n`
const wordListPath = require('word-list');

const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n');

function getRandomInt(max) 
{
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandWords()
{
	a = []
	var n = getRandomInt(wordArray.length - 1)
	// var url = `https://www.dictionary.com/browse/${wordArray[n]}`
	// a.push(wordArray[n])
	// a.push(url)
    return wordArray[n]
}

const fetch = require("node-fetch");

// async function get_data(query){
//     try {
//       const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${query}`);
//       const json = await response.json();
//       console.log(json[3][1]);
//     } catch (error) {
//       console.log(error);
//     }
// };
  
// var query = 'apple';
// var url = ;

// get_data(query)


// /** urban-dictionary */
// const Filter = require('bad-words')
// const ud = require('urban-dictionary')

// const filter = new Filter()

// // Callback example.
// ud.random((error, entry) => {
//   if (error) {
// 	console.error(error.message)
// } else {
// 	// console.log(filter.clean(entry.word))
// 	var w = filter.clean(entry.word)

// 	// console.log(filter.clean(entry.definition))
// 	var d = filter.clean(entry.definition)

//     // console.log(entry.example)
// 	var g = {w: d}
//   }
// })

// make list of 3 random words

// insert those words through the api

// output it as json

// take those output to the ejs to get display on

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
	/* Signup User */ .post('/signup', auth.signupUser)

	// Routes 
	/* Home */ .get('/', auth.loadHome)
	/* Game */ .get('/game', (req, res) => res.render('pages/game'))
	// /* Word */ .get('/choose_word', (req, res) => {
	// 												// var data = words3()
	// 												var data0 = getRandWords()
	// 												var dataInfo0 = data0[1]
	// 												var data1 = getRandWords()
	// 												var dataInfo1 = data1[1]
	// 												var data2 = getRandWords()
	// 												var dataInfo2 = data2[1]
	// 												// console.log(data0)
	// 												// console.log(data1)
	// 												// console.log(data2)
	// 												res.render('pages/word_list.ejs', {data0: data0[0], data1: data1[0], data2: data2[0], dataInfo0: dataInfo0, dataInfo1: dataInfo1, dataInfo2: dataInfo2})
	// 												})

	/* Word */ .get('/choose_word', async (req, res) => {
													// var data = words3()
													

													try {
														var data0 = getRandWords()
														const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data0}`);
														const json = await response.json();
														const dataInfo0 = await json[3][1]

														var data1 = getRandWords()
														const response1 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data1}`);
														const json1 = await response1.json();
														const dataInfo1 = await json1[3][1]

														var data2 = getRandWords()
														const response2 = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${data2}`);
														const json2 = await response2.json();
														const dataInfo2 = await json2[3][1]
														
														// console.log(json[3][1]);
														res.render('pages/word_list.ejs', {data0: data0, data1: data1, data2: data2, dataInfo0: dataInfo0, dataInfo1: dataInfo1, dataInfo2: dataInfo2})
													} catch (error) {
														console.log(error);
													}
													// console.log(data0)
													// console.log(data1)
													// console.log(data2)
													
													})

	// Start Listening 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))
