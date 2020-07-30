// ================
//    Game UI

// Parse the user session that was passed from the server into the HTML ...
var session = JSON.parse($('#sessionJSON').text());
$('#sessionJSON').remove(); // .. then remove the JSON from the document.


/* Tell the server to add the client to the session room
and add the player object to the game.players object */
socket.emit('addUserToRoom', {session})

// UI Update Loop - runs every 0.5 seconds to update the state of client's UI.
// e.g. updating player scores, or changing the view from artist to guesser.
// setInterval(function(){ 
// 	socket.emit('getUiUpdate', {session})
// }, 500);
socket.emit('getUiUpdate', {session})

// Function to update the player list in the game sidebar.
function updatePlayerList(game) {
  players_list_container = document.getElementById('players-list')
  players_list_container.innerHTML = "";
  Object.keys(game.players).forEach(function(player) {
    const div = document.createElement('div');
    div.classList.add('player-list-item');
    var player_name = game.players[player].id;
    if (game.players[player].id == session.username) {var player_name = game.players[player].id + ' (You)'}
    var player_score = game.players[player].score;
    var player_place = game.players[player].place;
    div.innerHTML = `<div class="place"> <div class="medal ${player_place}"><span><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">1</font></font></span></div></div><div class="player-details"> <div class="player-details-name"><span><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">${player_name}</font></font></span></div><div class="player-details-points"><span><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">${player_score} points</font></font></span></div></div>`;
    players_list_container.appendChild(div);
  });
}

// Receive UI Update event from server, and update client UI accordingly.
socket.on('uiUpdate', game => {
    updatePlayerList(game);
});

// Get the Leave Button object from the page.
var leaveButton = document.querySelector('.leave-button');
/* Add an event listener that redirects the player to 
   home page when clicking the leave button. */
leaveButton.addEventListener('click',function(evt){
    window.location.href = '../';
})

//    END OF GAME LOGIC
// =======================



// ==========
//    CHAT
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

// Output Chat Message from Server
socket.on('message',message => {
  outputMessage(message);

  //Scroll down the chatbox automatically
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('welcome-message',message => {
  outputWelcomeMessage(message);
  var chime = new Audio('/sound/positive-alert.wav')
  chime.volume = 0.5
  chime.play();
  //Scroll down the chatbox automatically
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('disconnect-message',message => {
  outputDisconnectMessage(message);
  var chime = new Audio('/sound/negative-alert.wav')
  chime.volume = 0.5
  chime.play();
  //Scroll down the chatbox automatically
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  // Get message text
  const msg = e.target.elements.msg.value;

  if (msg != '') {
  // Emit message to server
  socket.emit('chatMessage',msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
  }
})

// Output message to document
function outputMessage(message) {
  const div = document.createElement('div');
  var style = message.style
  if (style != '') {div.classList.add('style');}
  div.classList.add('message'); // create div class 'message'
  div.innerHTML = `<p><span class='bold'>${message.username}:</span> ${message.content}</p>`;
  document.querySelector('.chat-messages').appendChild(div);
}

function outputWelcomeMessage(message) {
  const div = document.createElement('div');
  var style = message.style
  if (style != '') {div.classList.add('style');}
  div.classList.add('message', style); // create div class 'message'
  div.innerHTML = `<p>${message.content}</p>`;
  document.querySelector('.chat-messages').appendChild(div);

}

function outputDisconnectMessage(message) {
  const div = document.createElement('div');
  var style = message.style
  if (style != '') {div.classList.add('style');}
  div.classList.add('message', style); // create div class 'message'
  div.innerHTML = `<p>${message.content}</p>`;
  document.querySelector('.chat-messages').appendChild(div);
}
//    END OF CHAT
// =================




// ============
//    CANVAS
var canvas = new fabric.Canvas('draw-area');
var canvasHtml = document.getElementById('draw-area');
var context = canvasHtml.getContext("2d");
var color = "#ff0000"
var clearEl = $(document.getElementById('tool-clear'));

canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = 5;
canvas.freeDrawingBrush.color = color;
fabric.Object.prototype.selectable = false;

//Initializing tools for the undo and redo items
var canvasState = [];
var indexTracker = -1;
var undoStatus = false; //A lock for the undo status to solve some concurrency issues between undo and update canvas
var redoStatus = false; //A lock for the undo status to solve some concurrency issues between redo and update canvas
var undoButton = $(document.getElementById('tool-undo'));
var redoButton = $(document.getElementById('tool-redo'));
var fillButton = $(document.getElementById('tool-fill'));
var colorButton = $(document.getElementById('tool-color'));
var eraserButton = $(document.getElementById('tool-eraser'));
var undoLock =true; //A lock for the undo status to solve the spamming of undo
var redoLock =true; //A lock for the redo status to solve the spamming of redo
var isFillOn = false;
var canvasLock = false;


      // canvas.on('mouse:up', function() {
//     canvas.getObjects().forEach(o => {
//       o.fill = 'blue'
//     });
//     canvas.renderAll();
//   })


//This function updates the canvas status and stores it
var updateCanvasState = function() {
  if((!(undoStatus) && !(redoStatus))){
    var jsonData = canvas.toJSON(); //Transfers the canvas to JSON object

    var canvasAsJson = JSON.stringify(jsonData); //Gets Changed it to JSON string
    //This section resizes the currentState array length when a user does "undo" then draws again
    if(indexTracker < canvasState.length-1){
      var indexToBeInserted = indexTracker+1;
      canvasState[indexToBeInserted] = canvasAsJson;
      var numberOfElementsToRetain = indexToBeInserted+1;
      canvasState = canvasState.splice(0,numberOfElementsToRetain);
    }else{
      canvasState.push(canvasAsJson);
    }
    indexTracker = canvasState.length-1; 
  }
}

var undo = function() {
  if(undoLock){
    if(indexTracker == -1){
      undoStatus = false;
    }
    else{
      if (canvasState.length >= 1) {
        undoLock = false;
        if(indexTracker != 0){
          undoStatus = true;
          canvas.loadFromJSON(canvasState[indexTracker-1],function(){
              canvas.renderAll();
              undoStatus = false;
              indexTracker -= 1;
              if(indexTracker !== canvasState.length-1){
              }
            undoLock = true;
          });
        }
        else if(indexTracker == 0){
           canvas.clear();
          undoLock = true;
          indexTracker -= 1;
        }
      }
    }
  }
}

var redo = function() {
  if(redoLock){
    if((indexTracker == canvasState.length-1) && indexTracker != -1){
    }else{
      if (canvasState.length > indexTracker && canvasState.length != 0){
        redoLock = false;
        redoStatus = true;
        canvas.loadFromJSON(canvasState[indexTracker+1],function(){

            canvas.renderAll();
            redoStatus = false;
            indexTracker += 1;
            if(indexTracker != -1){
            }
          redoLock = true;
        });
      }
    }
  }
}


//Updates the canvas state everytime a pixel is added
canvas.on(
  'object:added', function(){
      updateCanvasState();
      if(canvasLock === false)
      {
        
        var data = canvas.toJSON()
        socket.emit('mouse',data)
      }
  }
);

// function updateBoard(shouldEmit){
//   updateCanvasState();
//   if(shouldEmit)
//   {
//   var data = canvas.JSON()
//   socket.emit('mouse',data)
//   }
// }


  
undoButton.click(function(){
  undo();
});

redoButton.click(function(){
  redo();
});

clearEl.click(function() { 
 
  updateCanvasState();
  canvas.clear() 

}
 
 )

 eraserButton.click(function(){
   canvas.freeDrawingBrush.color = "#ffffff";
   
   canvas.freeDrawingBrush.width = 10;
 })

 colorButton.click(function(){
  canvas.freeDrawingBrush.color = "#ff0000";
  canvas.freeDrawingBrush.width = 5;
  
})

socket.on('mouse',(data)=>{
  canvasLock = true
  var canvasAsJson = JSON.stringify(data);
  canvas.loadFromJSON(canvasAsJson)
  canvas.renderAll();
})

// socket.on('mouse',(data) =>{
//   receive_draw(data.x,data.y,data.px,data.py,data.color,data.size);
// })

// socket.on('clear',() =>{
//   context.clearRect(0,0,canvas.width,canvas.height);
// })

// socket.on('undo',(stack) =>{
//   context.clearRect(0,0,canvas.width,canvas.height);
//   stack.forEach(path=>{
//       context.beginPath();
//       context.strokeStyle = path[0].colour;
//       context.lineWidth = path[0].brushSize;
//       context.moveTo(path[0].x,path[0].y);
//       for(let i = 1; i < path.length; i++){
//           context.lineTo(path[i].x,path[i].y);
//       }
//       context.stroke();
//   })
// })





// const canvas = document.getElementById('draw-area');
// let isMouseDown = false;
// const context = canvas.getContext('2d');
// var eraser = document.getElementById('tool-eraser');
// //var colourWheel = document.getElementById('tool-color');
// var undoButton = document.getElementById('tool-undo');
// var selectedColor = '#000'
// var colour = selectedColor;
// //var slider = document.getElementById('tool-size');
// var clear = document.getElementById('tool-clear')
// var brushSize = 1;
// let x,y = 0;
// let tempStack = [];
// let undoStack= [];

// // slider.addEventListener('input',function(evt){
// //     brushSize = this.value;
// // })
// // colourWheel.addEventListener('input', function(evt){
// //     colour = this.value;
// // })
// clear.addEventListener('click',function(evt){
//     context.clearRect(0,0,canvas.width,canvas.height);
//     undoStack = [];
//     sendclear();
// })
// eraser.addEventListener('click', function(evt){
//     colour = 'white';
// })

// undoButton.addEventListener('click', (evt)=>{
//     undoStack.pop();
//     undoStack.pop();
//     context.clearRect(0,0,canvas.width,canvas.height);
//     undoStack.forEach(path=>{
//         // context.lineJoin = context.lineCap = 'round';
//         context.beginPath();
//         context.strokeStyle = path[0].colour;
//         context.lineWidth = path[0].brushSize;
//         context.moveTo(path[0].x,path[0].y);
//         for(let i = 1; i < path.length; i++){
//             context.lineTo(path[i].x,path[i].y);
//         }
//         context.stroke();
//     })
//     socket.emit('undo',undoStack);
// })
// canvas.addEventListener('mousedown',(evt)=>{

//     x = evt.offsetX;
//     y = evt.offsetY;
//     isMouseDown = true;
//     context.lineJoin = context.lineCap = 'round'
//     tempStack = [];

//     tempStack.push({x,y,colour,brushSize})

// })


// canvas.addEventListener('mousemove',(evt)=>{
//     if(isMouseDown){
//         console.log("MOUSE DOWN")
//         draw(context,x,y,evt.offsetX, evt.offsetY);
//         x = evt.offsetX;
//         y = evt.offsetY;
//         tempStack.push({x,y,colour,brushSize})

//     }
// });

// window.addEventListener('mouseup',(evt)=>{
//     if (isMouseDown){
//         draw(context,x,y,evt.offsetX, evt.offsetY);
//         x = 0;
//         y = 0;
//         isMouseDown = false;
//     }
//     undoStack.push(tempStack)
// })

// function draw(context,x,y,x2,y2){
//     context.beginPath();
//     context.strokeStyle = colour;
//     context.lineWidth = brushSize;
//     context.moveTo(x, y);
//     context.lineTo(x2, y2);
//     context.stroke();
//     context.closePath();
//     sendmouse(x,y,x2,y2,colour,brushSize);
// }
// function sendmouse(x,y,px,py,color,size){
//   const data = {
//     x:x,
//     y:y,
//     px:px,
//     py:py,
//     color: color,
//     size:size
//   }
//   socket.emit('mouse',data);
// }
// function sendclear(){
//   socket.emit('clear');
// }
// function receive_draw(x,y,px,py,color,size){
//   colour = color;
//   brushSize = size;
//   context.beginPath();
//   context.strokeStyle = colour;
//   context.lineWidth = brushSize;
//   context.moveTo(x, y);
//   context.lineTo(px,py);
//   context.stroke();
//   context.closePath();
// }

// socket.on('mouse',(data) =>{
//   receive_draw(data.x,data.y,data.px,data.py,data.color,data.size);
// })

// socket.on('clear',() =>{
//   context.clearRect(0,0,canvas.width,canvas.height);
// })

// socket.on('undo',(stack) =>{
//   context.clearRect(0,0,canvas.width,canvas.height);
//   stack.forEach(path=>{
//       context.beginPath();
//       context.strokeStyle = path[0].colour;
//       context.lineWidth = path[0].brushSize;
//       context.moveTo(path[0].x,path[0].y);
//       for(let i = 1; i < path.length; i++){
//           context.lineTo(path[i].x,path[i].y);
//       }
//       context.stroke();
//   })
// })

//    END OF CANVAS
// ===================