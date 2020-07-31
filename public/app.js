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
setInterval(function(){ 
	socket.emit('getUiUpdate', {session})
}, 500);

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

// Function to update the player list in the game sidebar.
function updateTimer(game) {
  var timer_container = document.getElementById('round-timer')
  var phase_container = document.getElementById('phase')
  var time_left = game.timer_seconds.toString();
  var phase = game.phase;
  timer_container.innerHTML = `<span>${time_left}</span>`;
  phase_container.innerHTML = `<span>${phase}</span>`;
}

function updateGameSidebar(game) {
  updatePlayerList(game);
  updateTimer(game); // this is going to need the value: (current phase duration - time passed in delay func)
}

// Receive UI Update event from server, and update client UI accordingly.
socket.on('uiUpdate', game => {
  // game object -> round -> current turn -> artist id
  // if this clients id == artist id
  // then: renderArtistUI(updateX...updateY...)
  // if this clients id =/= artist id
  // then: renderGuesserUI(updateX...updateY...)
    updateGameSidebar(game);
});

// Get the Leave Button object from the page.
var leaveButton = document.querySelector('.leave-button');
/* Add an event listener that redirects the player to 
   home page when clicking the leave button. */
leaveButton.addEventListener('click',function(evt){
    window.location.href = '../';
})

var startButton = document.querySelector('.start-button');
startButton.addEventListener('click',function(evt){
    var game_id = session.currentRoom;
    socket.emit('startGame', {game_id})
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

const canvas = document.getElementById('draw-area');
let isMouseDown = false;
const context = canvas.getContext('2d');
var eraser = document.getElementById('tool-eraser');
//var colourWheel = document.getElementById('tool-color');
var undoButton = document.getElementById('tool-undo');
var selectedColor = '#000'
var colour = selectedColor;
//var slider = document.getElementById('tool-size');
var clear = document.getElementById('tool-clear')
var brushSize = 1;
let x,y = 0;
let tempStack = [];
let undoStack= [];

// slider.addEventListener('input',function(evt){
//     brushSize = this.value;
// })
// colourWheel.addEventListener('input', function(evt){
//     colour = this.value;
// })
clear.addEventListener('click',function(evt){
    context.clearRect(0,0,canvas.width,canvas.height);
    undoStack = [];
    sendclear();
})
eraser.addEventListener('click', function(evt){
    colour = 'white';
})

undoButton.addEventListener('click', (evt)=>{
    undoStack.pop();
    undoStack.pop();
    context.clearRect(0,0,canvas.width,canvas.height);
    undoStack.forEach(path=>{
        // context.lineJoin = context.lineCap = 'round';
        context.beginPath();
        context.strokeStyle = path[0].colour;
        context.lineWidth = path[0].brushSize;
        context.moveTo(path[0].x,path[0].y);
        for(let i = 1; i < path.length; i++){
            context.lineTo(path[i].x,path[i].y);
        }
        context.stroke();
    })
    socket.emit('undo',undoStack);
})
canvas.addEventListener('mousedown',(evt)=>{

    x = evt.offsetX;
    y = evt.offsetY;
    isMouseDown = true;
    context.lineJoin = context.lineCap = 'round'
    tempStack = [];

    tempStack.push({x,y,colour,brushSize})

})


canvas.addEventListener('mousemove',(evt)=>{
    if(isMouseDown){
        console.log("MOUSE DOWN")
        draw(context,x,y,evt.offsetX, evt.offsetY);
        x = evt.offsetX;
        y = evt.offsetY;
        tempStack.push({x,y,colour,brushSize})

    }
});

window.addEventListener('mouseup',(evt)=>{
    if (isMouseDown){
        draw(context,x,y,evt.offsetX, evt.offsetY);
        x = 0;
        y = 0;
        isMouseDown = false;
    }
    undoStack.push(tempStack)
})

function draw(context,x,y,x2,y2){
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = brushSize;
    context.moveTo(x, y);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
    sendmouse(x,y,x2,y2,colour,brushSize);
}
function sendmouse(x,y,px,py,color,size){
  const data = {
    x:x,
    y:y,
    px:px,
    py:py,
    color: color,
    size:size
  }
  socket.emit('mouse',data);
}
function sendclear(){
  socket.emit('clear');
}
function receive_draw(x,y,px,py,color,size){
  colour = color;
  brushSize = size;
  context.beginPath();
  context.strokeStyle = colour;
  context.lineWidth = brushSize;
  context.moveTo(x, y);
  context.lineTo(px,py);
  context.stroke();
  context.closePath();
}

socket.on('mouse',(data) =>{
  receive_draw(data.x,data.y,data.px,data.py,data.color,data.size);
})

socket.on('clear',() =>{
  context.clearRect(0,0,canvas.width,canvas.height);
})

socket.on('undo',(stack) =>{
  context.clearRect(0,0,canvas.width,canvas.height);
  stack.forEach(path=>{
      context.beginPath();
      context.strokeStyle = path[0].colour;
      context.lineWidth = path[0].brushSize;
      context.moveTo(path[0].x,path[0].y);
      for(let i = 1; i < path.length; i++){
          context.lineTo(path[i].x,path[i].y);
      }
      context.stroke();
  })
})

//    END OF CANVAS
// ===================