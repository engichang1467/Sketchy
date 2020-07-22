


app.get('/', (req, res) => res.render('pages/account/login'))





app.get('/adminDb', (req,res) =>{

	var getAllQuery = `SELECT * FROM usr`
	pool.query(getAllQuery, (error,results)=>{
		if (error)
			res.end(error);
		var results = {'rows':results.rows}
		res.render('pages/adminDb',results)
		
		
	}
	)

})

app.post('/signup',  (req, res) => res.render('pages/account/signUpPage'))

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
			res.render('pages/account/userNameTaken');
		}
	})

	// check if the user typed the same passward twice
	if (password != confirmed) {
		res.render('pages/account/passwordNotMatch')
	}

	// if not, add user to database
	var insert_query = 'INSERT INTO usr VALUES (\'';
	var addUserQuery = insert_query.concat(uname, '\', \'', password, '\', False)'); 
	pool.query(addUserQuery, (error, result)=>{
		if (error)
			res.end(error);
		res.render('pages/account/signUpSuccessful');
	})
})








module.exports = {
    getMonsters,
    addMonster,
    getMonsterById,
    updateMonster,
    deleteMonster
  }