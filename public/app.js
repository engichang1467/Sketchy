// ================
//    Game UI

// Parse the user session that was passed from the server into the HTML ...
var session = JSON.parse($('#sessionJSON').text());
$('#sessionJSON').remove(); // .. then remove the JSON from the document.


/* Tell the server to add the client to the session room
and add the player object to the game.players object */
socket.emit('addUserToRoom', {session})

// // UI Update Loop - runs every 0.5 seconds to update the state of client's UI.
// // e.g. updating player scores, or changing the view from artist to guesser.
// setInterval(function(){ 
// 	socket.emit('getUiUpdate', {session})
// }, 500);

var artist = ""

// Function to update the player list in the game sidebar.
function updateRoundTimer(game) {
  var timer_container = document.getElementById('round-timer')
  var time_left = game.timer_seconds.toString();
  timer_container.innerHTML = `<span>${time_left}</span>`;
}

// Function to update the player list in the game sidebar.
function updateRoundNumber(game) {
  var round_container = document.getElementById('round-number')
  round_container.innerHTML = `<div id="round-number"><span>Round <strong>${game.current_round_id}</strong> of <strong>3</strong></span></div>`;
}

// Function to update the player list in the game sidebar.
function updateGameStatus(game) {

  var status_container = document.getElementById('game-status')

  if (game.phase == 'pregame') { var status = `<span>Waiting to Start</span>` }

  if (game.phase == 'midgame') {

    let current_round_id = game.current_round_id
    let current_turn_id = game.rounds[current_round_id].current_turn_id
    let current_turn_phase = game.rounds[current_round_id].turns[current_turn_id].phase
    let current_artist_id = game.rounds[current_round_id].turns[current_turn_id].artist_id

    if (current_turn_phase == 'ending') {
      current_turn_phase = 'drawing'
    } // We don't want to show the user "Ending" as the current status in the UI (its just a backend var)
      //so instead we say "Drawing"

    var status = `<span>${current_artist_id} is ${current_turn_phase}!</span>`
  }

  status_container.innerHTML = status;
    
}

function updateGameName(game) {
  var game_name_container = document.getElementById('game-name')
  game_name_container.innerHTML = `<span>Game ${game.game_id}</span>`
}


// function renderUI(game) {

//   if(game.phase == 'pregame') {

//     // Render pregame sidebar containers.
//     var gameinfo = document.getElementById('game-info')
//     gameinfo.innerHTML = `
//         <div id="game-name"></div>
//         <div id="game-status"></div>
//         <div id="players-list"></div>
//     `;

//     updateGameName(game);
//     updateGameStatus(game);
//     updatePlayerList(game);

//   }

//   if(game.phase == 'midgame') {

//     // Render sidebar midgame containers.
//     var gameinfo = document.getElementById('game-info')
//     gameinfo.innerHTML = `
//         <div id="round-timer"></div>
//         <div id="round-number"></div>
//         <div id="game-status"></div>
//         <div id="players-list"></div>
//       `;


    
//     // Update individual UI components.
//     updatePlayerList(game);
//     updateRoundTimer(game);
//     updateRoundNumber(game);

//     // Render Artist UI
//     if (session.username == artist_id) {
//       canvas.isDrawingMode = true
//       var toolbar = document.getElementById('canvas-toolbar')
//       if (toolbar.classList.contains('disabled')) {
//         toolbar.classList.remove('disabled')
//       }
//       // TODO: renderArtistUI(updateX...updateY...)

//     // Render Guesser UI
//     } else {
//       canvas.isDrawingMode = false
//       var toolbar = document.getElementById('canvas-toolbar')
//       toolbar.classList.add('disabled')
//       // TODO: renderGuesserUI(updateX...updateY...)
//     }

//   }
// }

socket.on('clearCanvas', message => {
  canvas.clear();
});

// // Receive UI Update event from server, and update client UI accordingly.
// socket.on('uiUpdate', game => {

//   renderUI(game);

// });

socket.on('updateTimer', game => {
  updateRoundTimer(game);
  updateRoundNumber(game);
});

socket.on('updatePregameInfo', game => {
  updateGameStatus(game);
  updateGameName(game);
});


socket.on('updateSidebarContainers', game => {

  // Render containers for pregame game info sidebar
  if(game.phase == 'pregame') {
    var gameinfo = document.getElementById('game-info')
    gameinfo.innerHTML = `
        <div id="game-name"></div>
        <div id="game-status"></div>
        <div id="players-list"></div>
      `;

      updatePlayerList(game);

      updateGameStatus(game);
      updateGameName(game);

  }

  if(game.phase == 'midgame') {
    // Render midgame containers.
    var gameinfo = document.getElementById('game-info')
    gameinfo.innerHTML = `
        <div id="round-timer"></div>
        <div id="round-number"></div>
        <div id="game-status"></div>
        <div id="players-list"></div>
      `;

      updateGameStatus(game);
      updatePlayerList(game);

      renderRoleUI(game);

  }

});


function renderRoleUI(game) {

  // get players username
  var round = game.rounds[game.current_round_id]
  var turn = round.turns[round.current_turn_id]
  var role = game.players[session.username].current_role

  console.log(`I am ${role}`)

  // If player is a guesser this turn:
  if ( role == 'guesser') {
    var word_box = document.querySelector('.word-box')
    word_box.innerHTML = `
    <div class="placeholders">
    `
  }
  // If artist: 
  else if (role == 'artist') {

    if (turn.phase == 'choosing') {

      //Create containers for word box children
      var word_box = document.querySelector('.word-box')
      word_box.innerHTML = `
      <h2>Choose a Word</h2>
      <div class="word-choices"></div>
      `
      var word_choices = document.querySelector('.word-choices')

      // Add word choices to the word box.
      var i = 0;
      for (word in turn.word_list) {
        var choice = document.createElement('div');
        choice.classList.add('word-choice')
        choice.setAttribute('data-word', i)
        choice.innerHTML = `<span>${turn.word_list[word].word}</span>`
        word_choices.appendChild(choice);
        i++;
      }

      // word_choices.addEventListener("click",function(e) {
      //   if (e.target && e.target.matches("div.word-choice")) {
      //       word_chosen_id = e.target.getAttribute('data-word')
      //       socket.emit('wordChosen', word_chosen_id)
      //     }
      // });

    }

    if (turn.phase == 'drawing') {
      //Create containers for word box children
      var word_box = document.querySelector('.word-box')
      word_box.innerHTML = `
      <div class="word-info">
        <div class="word-name"></div>
        <div class="word-def"></div>
        <div class="word-link"></div>
      </div>
      `
      var word_name = document.querySelector('.word-name')
      var word_def = document.querySelector('.word-def')
      var word_link = document.querySelector('.word-link')
    }
  }
}

document.addEventListener("click", function(e) {
  if((e.target) && (e.target.classList.contains('word-choice'))) {
    word_chosen_id = e.target.getAttribute('data-word')
    console.log(`Word chosen event fired`)
    socket.emit('chooseWord', word_chosen_id)
  }
});

// Player List Handling //
socket.on('updatePlayerList', game => {
  updatePlayerList(game);
});

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





// ----------------- //



// Get the Leave Button object from the page.
var leaveButton = document.querySelector('.leave-button');
/* Add an event listener that redirects the player to 
   home page when clicking the leave button. */
leaveButton.addEventListener('click',function(evt){
    var game_id = session.currentRoom;
    socket.emit('leaveGame', game_id)
    window.location.href = '../';

})

var startButton = document.querySelector('.start-button');
startButton.addEventListener('click',function(evt){
    var game_id = session.currentRoom;
    socket.emit('startGame', game_id)
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

socket.on('disconnect-message', message => {
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

var brushWidth = 5;
var clearEl = $(document.getElementById('tool-clear'));

canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = brushWidth;

fabric.Object.prototype.selectable = false;

//Initializing tools for the undo and redo items
var canvasState = [];
var indexTracker = -1;
var undoStatus = false; //A lock for the undo status to solve some concurrency issues between undo and update canvas
var redoStatus = false; //A lock for the undo status to solve some concurrency issues between redo and update canvas
var undoButton = $(document.getElementById('tool-undo'));
var redoButton = $(document.getElementById('tool-redo'));
var fillButton = $(document.getElementById('tool-fill'));
var colorButton = document.getElementById('tool-color-wheel');
var eraserButton = $(document.getElementById('tool-eraser'));
var sizeSlider = document.getElementById('tool-size-slider');
var undoLock =true; //A lock for the undo status to solve the spamming of undo
var redoLock =true; //A lock for the redo status to solve the spamming of redo
var isFillOn = false; 
var canvasLock = false; //Used to make sure the other user won't keep sending a signal to the drawer
var undoOrRedoLock = false; //Used to make sure that it doesn't re-omit when an object is added
var color = colorButton.value;

canvas.freeDrawingBrush.color = color;



colorButton.addEventListener('input', function(evt){

    canvas.freeDrawingBrush.color = this.value;
})

sizeSlider.addEventListener('input', function(evt){
  canvas.freeDrawingBrush.width = this.value;
} )

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


//Undo logic
var undo = function() {
  //Uses teh undolock so that the spamming of undo won't glitch it out
  if(undoLock){
    if(indexTracker == -1){
      undoStatus = false;
    }
    else{
      undoOrRedoLock = true
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

      
      var data = canvas.toJSON()
      var canvas_data = {data: data, game_id: session.room_id}
      socket.emit('mouse',canvas_data)
      undoOrRedoLock = false
    }
    
  }
}

//Redo Logic
var redo = function() {
  if(redoLock){
    if((indexTracker == canvasState.length-1) && indexTracker != -1){
    }else{
      undoOrRedoLock = true
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
      var data = canvas.toJSON()
      var canvas_data = {data: data, game_id: session.room_id}
      socket.emit('mouse',canvas_data)
      undoOrRedoLock = false
    }
  }
}


function changeContextTop(input){

  canvas.contexTop = input
}

canvas.on(
  'object:added', function(){
    if(artist == session.username) {
      updateCanvasState();
      if( undoOrRedoLock === false) { 
        var data = canvas.toJSON()
        var canvas_data = {data: data, game_id: session.room_id}
        socket.emit('mouse',canvas_data)
      }
    }
  }
);

undoButton.click(function(){
  undo();
});

redoButton.click(function(){
  redo();
});

clearEl.click(function() { 
 
  undoOrRedoLock = true
  updateCanvasState();
  canvas.clear() 
  var data = canvas.toJSON()
  var canvas_data = {data: data, game_id: session.room_id}
  socket.emit('mouse',canvas_data)
  undoOrRedoLock = false

}
 
 )

 eraserButton.click(function(){
   canvas.freeDrawingBrush.color = "#ffffff";
   
   canvas.freeDrawingBrush.width = 10;
 })


socket.on('receive_mouse',(data)=>{
  // canvasLock = true
  var canvasAsJson = JSON.stringify(data);
  canvas.loadFromJSON(canvasAsJson)
  canvas.renderAll();
  // canvasLock = false
})

//    END OF CANVAS
// ===================