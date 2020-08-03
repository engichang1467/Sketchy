var io = require('socket.io-client')
var expect = require('chai').expect;




describe('Testing Sockets and chat room', function() {

    var socket1;
    var socket2;
    var socket3;
    it('User succesfully joins a room', function(done) {
      
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

    it('User succesfully receives a message from another user',function(done){
      var counter = 0;
      socket1 = io.connect('http://localhost:5000', {
                'reconnection delay' : 0
                , 'reopen delay' : 0
                , 'force new connection' : true
            });
      
      socket1.on('connect',function(done){
          
        socket1.on('message', function(msg){

          if (counter ==0){
          expect(msg.content).to.equal('Welcome tester1!')
          }
          else if (counter == 1){
            expect(msg.content).to.equal('Welcome tester2!')
          }
          else if (counter ==2){
            expect(msg.content).to.equal('Hello There')
            console.log(msg)
          }
          counter++;
          if (counter == 3)
          {
            socket1.disconnect();
            console.log("disconnecting socket1...")
            socket2.disconnect();
            console.log("disconnecting socket2...")
            
          }
          
        })
        var session = {username: "tester1", currentRoom: 1}
        
        socket1.emit('addUserToRoom',{session});
        socket2 = io.connect('http://localhost:5000', {
                'reconnection delay' : 0
                , 'reopen delay' : 0
                , 'force new connection' : true
            });
        socket2.on('connect',function(done){
          var session = {username: "tester2", currentRoom: 1}
          var message = "Hello There"
          socket2.emit('addUserToRoom',{session});
          var msg = "Hello There"
          socket2.emit('chatMessage',msg);
        })
        
      })
      done();
    })

});
