var io = require('socket.io-client')
var expect = require('chai').expect;




describe('Testing Game Room Sockets', function() {

    var socket1;
    var socket2;
    var socket3;
    var s3Msgs= 0;
    
    //This will test when a user joins a room and will test the welcome message as well
    it('User succesfully joins a room', function(done) {
      
      socket1 = io.connect('http://localhost:5000', {
                'reconnection delay' : 0
                , 'reopen delay' : 0
                , 'force new connection' : true
            });
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


    // Will test when two users are in a room and messages each other. Will also test when a third member
    // joins a different room. They should not receive the messages

    

    // it('User succesfully receives a message from another user in the same room',function(done){
    //   var counter = 0;

      
    //   socket1 = io.connect('http://localhost:5000', {
    //             'reconnection delay' : 0
    //             , 'reopen delay' : 0
    //             , 'force new connection' : true
    //         });
    //   //socket 1 connects
    //   socket1.on('connect',function(done){

    //     //socket 1 checks that the correct messages will be sent
    //     //and in the same order.
    //     socket1.on('message', function(msg){
    //       if (counter ==0){
    //       expect(msg.content).to.equal('Welcome tester1!')
    //       }
    //       else if (counter == 1){
    //         expect(msg.content).to.equal('Welcome tester2!')
    //       }
    //       else if (counter ==2){
    //         expect(msg.content).to.equal('Hello There')
    //       }
    //       counter++;
    //       if (counter == 3)
    //       {
    //         socket3.disconnect();
    //         socket2.disconnect();
    //         console.log("disconnecting socket2...")
            
    //       }
    //       if (counter ==4)
    //       {
    //           expect(msg.content).to.equal('tester2 has left the game!')
    //           socket1.disconnect();
    //           console.log("disconnecting socket1...")
    //       }
          
    //     })
    //     var session = {username: "tester1", currentRoom: 1}
    //     socket1.emit('addUserToRoom',{session});

    //     //socket 2 connects
    //     socket2 = io.connect('http://localhost:5000', {
    //             'reconnection delay' : 0
    //             , 'reopen delay' : 0
    //             , 'force new connection' : true
    //         });
    //     socket2.on('connect',function(done){
          
    //      //Socket 3 connects
    //       socket3 = io.connect('http://localhost:5000', {
    //         'reconnection delay' : 0
    //         , 'reopen delay' : 0
    //         , 'force new connection' : true
    //     });
    //       socket3.on('connect', function(done){
    //         //Socket 3 joins room
    //         var session = {username: "tester3", currentRoom: 2}
    //         socket3.emit('addUserToRoom', {session})
    //         socket3.on('message', function(msg){
    //           s3Msgs++;

    //         })
    //         //Socket 3 sends a message, socket 1 should not receive this or error will appear
    //         var msg = "Hi is this the right room?";
    //         socket3.emit('chatMessage',msg);

    //         //Wait for socket 3 to send a message and then make socket 2 enter a room and send a message
    //         //socket 2's message should only be sent to room 1
    //         setTimeout(function(){var session = {username: "tester2", currentRoom: 1}
    //         socket2.emit('addUserToRoom',{session});
    //         var msg = "Hello There"
    //         socket2.emit('chatMessage',msg);}, 200)
          
    //       })

    //     })
        
    //   })
    //   //Timeout is set so we can wait for all messages to be sent
    //   setTimeout(function(){
    //     expect(s3Msgs).to.equal(2)
    //     done();
    //   },500)
      
    // });
});

