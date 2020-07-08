const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg'); 
var pool; 
pool = new Pool ({
	connectionString: 'postgres://postgres:root@localhost/users' 
	// connectionString: process.env.DATABASE_URL
});

var app = express()

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public'))); 
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('pages/login'))

app.post('/login', (req, res) => {
	var uname = req.body.uname;
	var password = req.body.pwd; 
	var query = 'SELECT Password FROM usr WHERE userName = \''
	var getPasswordQuery = query.concat(uname, '\''); 
	pool.query(getPasswordQuery, (error, result)=>{
		if (error)
			res.end(error);
		var pwd = (Object.values(result.rows[0])[0]).trim();
		if (pwd == password) {
			res.send("Correct Password"); 
		}
		res.render('pages/tryAgainPage');
	})
})

app.post('/signup',  (req, res) => res.render('pages/signUpPage'))

app.post('/addUser', (req, res) => {
	var uname = (req.body.add_userName).trim(); 
	var password = req.body.add_password; 
	var confirmed = req.body.confirm_password; 
	var name_list = [];
	var i; 

	// check if the username has already been taken
	var getNamesQuery = 'SELECT DISTINCT userName FROM usr' 
	pool.query(getNamesQuery, (error, result)=>{
		if (error)
			res.end(error);
		for (i = 0; i < (result.rows).length; i++) {
			name_list.push((Object.values(result.rows[i])[0]).trim());
		}
		if (name_list.includes(uname)) {
			res.render('pages/userNameTaken');
		}
	})

	// check if the user typed the same passward twice
	if (password != confirmed) {
		res.render('pages/passwordNotMatch')
	}

	// if not, add user to database
	var insert_query = 'INSERT INTO usr VALUES (\'';
	var addUserQuery = insert_query.concat(uname, '\', \'', password, '\', False)'); 
	pool.query(addUserQuery, (error, result)=>{
		if (error)
			res.end(error);
		res.render('pages/signUpSuccessful');
	})
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
