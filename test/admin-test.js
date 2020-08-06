var chai = require('chai'); 
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
var request = require('supertest');
var app = require('../index');

const adminInfo = {
    uname: "master",
    pwd: "imurfather"
}

const userInfo = {
    uname: "test",
    pwd: "test"
}

var loginAdmin = request.agent(app); 

// admin log in before testing
before(function(done) {
  loginAdmin
    .post('/login')
    .send(adminInfo)
    .end(function(err, response){
      expect(response.statusCode).to.equal(302);
      expect('Location', 'pages/home');
      done();
    });
});

var loginUser = request.agent(app); 

// normal user log in
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

describe('Checking Admin Privilege', function(done){

    it('Log in as admin: view user database --> successful', function(done) {
        loginAdmin.get('/admin')
        .expect(200, done); 
    });
    it('Log in not as admin: view user database --> should be denied', function(done) {
        loginUser.get('/admin')
        .expect(302, done); 
    });
});