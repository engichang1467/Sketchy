
// const Pool = require('pg').Pool
// const pool = new Pool({
//     user: 'sketchyadmin',
//     host: 'localhost',
//     database: 'usr',
//     password: 'admin'
//   })
require('dotenv').config()
const { Pool } = require('pg'); 
var pool; 
const session = require('express-session');
// process.env.DATABASE_URL
pool = new Pool ({
	connectionString: process.env.LOCALDB
});
const loginUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim(); 
    
    if (username && password) {
		pool.query('SELECT * FROM usr WHERE username = $1 AND password = $2', [username, password], (error, result, fields) => {
            if (error) throw error;
			if (!(result.rows.length === 0)) {
				        request.session.loggedin = true;
                request.session.username = username;
                request.session.admin = result.rows[0].admin;
                request.session.alerts =[[`Login successful!`, 'alert-success', 'exclamation-triangle']]
                response.redirect('/');
			} else {
                request.session.alerts = [[`Account not found!`, 'alert-warning', 'exclamation-triangle']]
                response.redirect('/');
			}			
			response.end();
		});
	} else {
        request.session.alerts = [[`Please enter your details!`, 'alert-warning', 'exclamation-triangle']]
        response.redirect('/');
        return false;
	}
}

const signupUser = (request, response) => {
	var username = request.body.uname.trim();
    var password = request.body.pwd.trim();
    var confirm = request.body.confirmpwd.trim(); 
    
    if (username && password && confirm && (password === confirm)) {
		pool.query('INSERT INTO usr VALUES ($1, $2, false)', [username, password], (error, result, fields) => {
            if (error) {
                console.log(error)
                request.session.alerts = [['This username is already taken!', 'alert-failure', 'exclamation-triangle']]
                response.redirect('/');
            } else {
                request.session.alerts = [['Signup Successful! Please login below.', 'alert-success', 'check']]
                response.redirect('/');
            }
		
			response.end();
		});
	} else {
        request.session.alerts = [[`Please enter your details.`, 'alert-warning', 'exclamation-triangle']]
        response.redirect('/');
        return false;
	}
}

const logoutUser = (request, response) => {
  request.session.alerts = (request.session.alerts) ? request.session.alerts : []
  if (request.session.loggedin == true) {
    request.session.destroy()
    response.redirect('/');
  } else {
    request.session.alerts = [[`You are already logged out!`, 'alert-warning', 'exclamation-triangle']]
    response.redirect('/');
    return false;
  }
  
}

const loadHome = (request, response) => {
    request.session.alerts = (request.session.alerts) ? request.session.alerts : []
    if (request.session.loggedin == true) {
        response.render('pages/home', {session: request.session})
        request.session.alerts.length = 0;
        request.session.save(err => {
            if (err) {
              throw err;
            };
          });
    } else {
        response.render('pages/home', {session: request.session})
        request.session.alerts.length = 0;
        request.session.save(err => {
            if (err) {
              throw err;
            };
          });
    }
    
}

module.exports = {
    loginUser,
    signupUser,
    logoutUser,
    loadHome
  }