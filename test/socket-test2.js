var io = require('socket.io-client')
var expect = require('chai').expect;


// describe('Testing independent room',function(){
//     it('Users dont receive messages from different rooms', function(done){
    
//       var user1;
//       var user2;
//       var user3;
//       var numMsgRcvd1 = 0;
//       var numMsgRcvd2 = 0;
//       var numMsgRcvd3 = 0;
//       var counter = 0;
//       user1 = io.connect('http://localhost:5000', {
//                 'reconnection delay' : 0
//                 , 'reopen delay' : 0
//                 , 'force new connection' : true
//             });
      
//       user1.on('connect',function(done){
          
//         user1.on('message', function(msg){
  
//          numMsgRcvd1++;
  
          
//         })
//         var session = {username: "tester1", currentRoom: 1}
//         user1.emit('addUserToRoom',{session});
//         user2 = io.connect('http://localhost:5000', {
//                 'reconnection delay' : 0
//                 , 'reopen delay' : 0
//                 , 'force new connection' : true
//             });
//         user2.on('connect',function(done){
//           var session = {username: "tester2", currentRoom: 1}
//           user2.emit('addUserToRoom',{session});
//           user2.on('message',function(msg){
//             numMsgRcvd2++;
//           })
  
//           user3 = io.connect('http://localhost:5000', {
//                 'reconnection delay' : 0
//                 , 'reopen delay' : 0
//                 , 'force new connection' : true
//             });
  
//           user3.on('connect',function(done){
  
//             var session = {username: "tester3", currentRoom: 2}
//             user3.emit('addUserToRoom',{session});
            
//             user3.on('message',function(msg){
  
//               numMsgRcvd3++;
//             })
//             var msg = "Hello There, is this the right room?"
//             user3.emit('chatMessage',msg);
  
  
  
//           })
          
          
//         })
        
//       })
//       done();
      
  
//     })
//   })
  