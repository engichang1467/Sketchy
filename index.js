const express = require('express')
const session = require('express-session');
const path = require('path');
const PORT = process.env.PORT || 5000
const auth = require('./authentication')
var randWords = require('random-words')

function words3(){
	return randWords(3)
}


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
	/* Word */ .get('/choose_word', (req, res) => {
													var data = words3()
													var data0 = data[0]
													var data1 = data[1]
													var data2 = data[2]
													// console.log(data0)
													// console.log(data1)
													// console.log(data2)
													res.render('pages/word_list.ejs', {data0: data0, data1: data1, data2: data2})
													})

	// Start Listening 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))
