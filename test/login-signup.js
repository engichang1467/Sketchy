var expect = require('chai').expect;
var app = require('../index');
var request = require('supertest');

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
      expect(response.statusCode).to.equal(200);
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