
// const Pool = require('pg').Pool
// const pool = new Pool({
//     user: 'sketchyadmin',
//     host: 'localhost',
//     database: 'usr',
//     password: 'admin'
//   })

const { Pool } = require('pg'); 
var pool; 
//   postgres://postgres:6757@localhost/usr'
pool = new Pool ({
	connectionString: 'process.env.DATABASE_URL'
});

const loginUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim(); 
    
    if (username && password) {
		pool.query('SELECT * FROM usr WHERE userName = $1 AND Password = $2', [username, password], (error, result, fields) => {
            if (error) throw error;
			if (!(result.rows.length === 0)) {
				request.session.loggedin = true;
                request.session.username = username;
                response.render('pages/home', {alerts: [['Login Successful!', 'alert-success', 'check']], session: request.session});
                return false;
			} else {
                response.render('pages/home', {alerts: [['Account not found, please try again!', 'alert-failure', 'exclamation-triangle']], session: request.session});
                return false;
			}			
			response.end();
		});
	} else {
        response.render('pages/home', {alerts: [['Enter Your Details', 'alert-warning', 'exclamation-triangle']], session: request.session});
        return false;
	}
}

const signupUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim();
    var confirm = request.body.confirmpwd.trim(); 
    var session = request.session
    
    if (username && password && confirm && (password === confirm)) {
		pool.query('INSERT into usr values ($1, $2, false)', [username, password], (error, result, fields) => {
            if (error) {
                console.log(error)
                response.render('pages/home', {alerts: [['Signup Failed', 'alert-failure', 'exclamation-triangle']], session});
            } else {
            response.render('pages/home', {alerts: [['Signup Successful!', 'alert-success', 'check']], session});
            return false;
            }
		
			response.end();
		});
	} else {
        response.render('pages/home', {alerts: [['Enter Your Details', 'alert-warning', 'exclamation-triangle']], session});
        return false;
	}
}


const loadHome = (request, response) => {
    session = request.session
    if (request.session.loggedin == true) {
        response.render('pages/home', {alerts: [], session})
    } else {
        response.render('pages/home', {alerts: [], session})
    }
    
}

module.exports = {
    loginUser,
    signupUser,
    loadHome
  }