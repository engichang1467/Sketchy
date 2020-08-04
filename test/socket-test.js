var io = require('socket.io-client')
var expect = require('chai').expect;




describe('Testing Game Room Sockets', function() {

    var socket1;
    var socket2;
    var socket3;
    var s3Msgs= 0;
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

    it('User succesfully receives a message from another user in the same room',function(done){
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
          }
          counter++;
          if (counter == 3)
          {
            socket2.disconnect();
            console.log("disconnecting socket2...")
            
          }
          if (counter ==4)
          {
              expect(msg.content).to.equal('tester2 has left the game!')
              socket1.disconnect();
              console.log("disconnecting socket1...")
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
          
         
          socket3 = io.connect('http://localhost:5000', {
            'reconnection delay' : 0
            , 'reopen delay' : 0
            , 'force new connection' : true
        });
          socket3.on('connect', function(done){
            var session = {username: "tester3", currentRoom: 2}
            socket3.emit('addUserToRoom', {session})
            socket3.on('message', function(msg){
              s3Msgs++;
              console.log(msg)
            })
            var msg = "Hi is this the right room?";
            socket3.emit('chatMessage',msg);

            var session = {username: "tester2", currentRoom: 1}
            socket2.emit('addUserToRoom',{session});
            var msg = "Hello There"
            socket2.emit('chatMessage',msg);
            


          })



        })
        
      })
      done();
    });
});

