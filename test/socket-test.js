var io = require('socket.io-client')
var expect = require('chai').expect;




describe('Testing Sockets', function() {

    var socket1;
    var socket2;

    describe('Check to see if a user can join a room', function() {

        it('User succesfully joins a room', function(done) {
          var session = {
            username: "iantest",
            content: "YOYOYO"
          }
          socket1 = io.connect('http://localhost:5000', {
                    'reconnection delay' : 0
                    , 'reopen delay' : 0
                    , 'force new connection' : true
                });
          socket1.on('message', function(msg){

            expect(msg.content).to.equal('Welcome tester1!')

            socket1.disconnect();
            done();
          })
          socket1.on('connect',function(done){
             
            var session = {username: "tester1", currentRoom: 1}
            socket1.emit('addUserToRoom',{session});

            
            
            
          })
            
        });


    });

});
