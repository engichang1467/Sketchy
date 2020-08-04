var expect = require('chai').expect;
var app = require('../index');
var request = require('supertest');

// testing login for existing user
const userInfo = {
    uname: "test",
    pwd: "test"
}

var loginUser = request.agent(app); 

before(function(done) {
  loginUser
    .post('/login')
    .send(userInfo)
    .end(function(err, response){
      expect(response.statusCode).to.equal(302);
      expect('Location', 'pages/home');
      done();
    });
});

describe('Check User Status / Login Function', function(done){
    it('Join game room: return successful(code 200) if user is logged in', function(done) {
      loginUser.get('/game/:id')
      .expect(200, done);
    });
});

// testing registration for new user
const signupInfo = {
  uname: "12345678", 
  pwd: "12345678", 
  confirmpwd: "12345678"
}

var userRegistration = request.agent(app);

before(function(done) {
  userRegistration
    .post('/signup')
    .send(signupInfo)
    .end(function(err, response){
      expect(response.statusCode).to.equal(302);
      expect('Location', 'pages/home');
      done();
    });
});

describe('User Registration', function(done){
  it('Log in: successful if registration succeeded', function(done) {
    userRegistration.post('/login')
    .send(signupInfo)
    .expect(302, done);
  });
});