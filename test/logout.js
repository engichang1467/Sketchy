var expect = require('chai').expect;
var app = require('../index');
var request = require('supertest');

const userInfo = {
    uname: "test",
    pwd: "test"
}

var loginUser = request.agent(app); 

// log user in
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

describe('Check User Status / Logout Function', function(done){

    it('Logging out function: returns successful and rediect to the home page', function(done) {
      // signing out
      loginUser.get('/logout')
      .expect(302, done);
    });
});
