var io = require('socket.io-client')
var expect = require('chai').expect;
var app = require('../index');

var property = {'reconnection delay':  0
, 'reopen delay': 0
, 'force new connection': true}

var socket_url = 'http://localhost:3000';
describe('Testing Game Room Sockets', function() {

    var socket1;
    var socket2;
    var socket3;
    
    //This will test when a user joins a room and will test the welcome message as well
    it('Users can succesfully join a game room', function(done) {
      
      socket1 = io.connect(socket_url,property);
      socket1.on('welcome-message', function(msg){

        expect(msg.content).to.equal('tester1 has joined the game!')

        socket1.disconnect();
        console.log("Disconnecting...")
        done();
      })
      socket1.on('connect',function(done){
          
        var session = {username: "tester1", currentRoom: 1}
        socket1.emit('addUserToRoom',{session});
      })
        
    });


    it ('Users can send messages within the same gameroom',function(done){
      var msg_to_send = "Hello There!"
      socket1 = io.connect(socket_url,property);
      socket1.on('message', function(msg){
        expect(msg.content).to.equal(msg_to_send)
        socket1.disconnect()
        socket2.disconnect()
        done();   
        
      })
      var session = {username: "tester1", currentRoom: 1}
      socket1.emit('addUserToRoom',{session});
      socket1.on('connect', function(done){

        socket2 = io.connect(socket_url,property)
        var session = {username: "tester2", currentRoom: 1}

        socket2.emit('addUserToRoom',{session});

        socket2.emit('chatMessageTest',msg_to_send)

      })
      
    })

    it ('Users will not receive messages from other rooms',function(done){

      var msg_to_send = "Hello There";
      var msg_to_send2 = "General Kenobi";
      var numbCalls = 0;
      var shouldEnd = false;
      socket1 = io.connect(socket_url, property)
      var session = {username: "tester1", currentRoom: 1}
      socket1.emit('addUserToRoom',{session});
      socket1.on('message', function(msg){
        numbCalls++;
        if(shouldEnd){
          expect(numbCalls).to.be.equal(1) //Should be called once
          socket2.disconnect();
          socket1.disconnect();
          done();
        }

      })
      socket1.on('connect', function(done){
        socket2 = io.connect(socket_url,property)

        socket2.on('connect',function(done){
          var session = {username: "tester2", currentRoom: 2}
          socket2.emit('addUserToRoom',{session});
          socket2.emit('chatMessageTest',msg_to_send);
          shouldEnd = true;
          socket1.emit('chatMessageTest',msg_to_send2)
        })
        

      })

      

    })

    it ('Users will be able to send their canvas data to others in the same room',function(done){
      
      var canvasEmitted1 = 0;
      var canvasEmitted2 = 0;
      var canvasEmitted3 = 0;
      socket1 = io.connect(socket_url,property);
      socket1.on('connect', function(done){

        var session = {username: "tester1", currentRoom: 1}
        socket1.emit('addUserToRoom',{session});
        socket1.on('receive_mouse', function(canva_data){

          canvasEmitted1++;

        })
        socket2 = io.connect(socket_url, property)

        socket2.on('connect', function(done){

          var session = {username: "tester2", currentRoom: 1}
          socket2.emit('addUserToRoom',{session});
          socket2.on('receive_mouse', function(canva_data){

            canvasEmitted2++;
          })

          socket3 = io.connect(socket_url, property)
          socket3.on('connect', function(done){

            var session = {username: "tester3", currentRoom: 2}
            socket3.emit('addUserToRoom',{session});
            socket3.on('receive_mouse', function(canva_data){

              canvasEmitted3++;
            })
            socket2.emit('mouse',"test");
          })
        })
      })
      setTimeout(function(){

        expect(canvasEmitted1).to.equal(1);
        expect(canvasEmitted2).to.equal(0);
        expect(canvasEmitted3).to.equal(0);
        socket1.disconnect()
        socket2.disconnect()
        socket3.disconnect()
        done();
      },300)
    })

    it("Users should be able to leave a game and send a disconnect message to all users in the same game room",function(done){

      var dcMessageCounter = 0;
      socket1 = io.connect(socket_url,property);
      socket1.on('connect', function(done){

        var session = {username: "tester1", currentRoom: 1}
        socket1.emit('addUserToRoom',{session});
        socket1.on('disconnect-message', function(canva_data){

          dcMessageCounter++;

        })
        socket2 = io.connect(socket_url, property)

        socket2.on('connect', function(done){

          var session = {username: "tester2", currentRoom: 1}
          socket2.emit('addUserToRoom',{session});
          socket3 = io.connect(socket_url, property)
          socket3.on('connect', function(done){

            var session = {username: "tester3", currentRoom: 2}
            socket3.emit('addUserToRoom',{session});
            socket2.emit('leaveGame');
            socket3.emit('leaveGame');
          })
        })  
      })
      setTimeout(function(){

        expect(dcMessageCounter).to.equal(1);
        socket1.disconnect()
        done();
      },300)

    })


    
});

