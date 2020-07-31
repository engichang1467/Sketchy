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


// fabric.PencilBrush = fabric.util.createClass(fabric.BaseBrush, /** @lends fabric.PencilBrush.prototype */ {
//   /**
//    * Discard points that are less than `decimate` pixel distant from each other
//    * @type Number
//    * @default 0.4
//    */
//   decimate: 0.4,
//   /**
//    * Constructor
//    * @param {fabric.Canvas} canvas
//    * @return {fabric.PencilBrush} Instance of a pencil brush
//    */
//   initialize: function(canvas) {
//     this.canvas = canvas;
//     this._points = [];
//   },
//   /**
//    * Invoked inside on mouse down and mouse move
//    * @param {Object} pointer
//    */
//   _drawSegment: function (ctx, p1, p2) {
//     var midPoint = p1.midPointFrom(p2);
//     ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
//     return midPoint;
//   },
//   /**
//    * Inovoked on mouse down
//    * @param {Object} pointer
//    */
//   onMouseDown: function(pointer, options) {
//     if (!this.canvas._isMainEvent(options.e)) {
//       return;
//     }
//     this._prepareForDrawing(pointer);
//     // capture coordinates immediately
//     // this allows to draw dots (when movement never occurs)
//     this._captureDrawingPath(pointer);
//     this._render();
//     if (!this.canvas._isMainEvent(options.e)) {
//       return true;
//     }
//     this.oldEnd = undefined;
//     this._finalizeAndAddPath();
//     return false;
//   },
//   /**
//    * Inovoked on mouse move
//    * @param {Object} pointer
//    */
//   onMouseMove: function(pointer, options) {
//     if (!this.canvas._isMainEvent(options.e)) {
//       return;
//     }
//     if (this._captureDrawingPath(pointer) && this._points.length > 1) {
//       if (this.needsFullRender()) {
//         // redraw curve
//         // clear top canvas
//         this.canvas.clearContext(this.canvas.contextTop);
//         this._render();
//       }
//       else {
//         var points = this._points, length = points.length, ctx = this.canvas.contextTop;
//         // draw the curve update
//         this._saveAndTransform(ctx);
//         if (this.oldEnd) {
//           ctx.beginPath();
//           ctx.moveTo(this.oldEnd.x, this.oldEnd.y);
//         }
//         this.oldEnd = this._drawSegment(ctx, points[length - 2], points[length - 1], true);
//         ctx.stroke();
//         ctx.restore();
//       }
//     }
//   },
//   /**
//    * Invoked on mouse up
//    */
//   onMouseUp: function(options) {
//     if (!this.canvas._isMainEvent(options.e)) {
//       return true;
//     }
//     this.oldEnd = undefined;
//     this._finalizeAndAddPath();
//     return false;
//   },
//   /**
//    * @private
//    * @param {Object} pointer Actual mouse position related to the canvas.
//    */
//   _prepareForDrawing: function(pointer) {
//     var p = new fabric.Point(pointer.x, pointer.y);
//     this._reset();
//     this._addPoint(p);
//     this.canvas.contextTop.moveTo(p.x, p.y);
//   },
//   /**
//    * @private
//    * @param {fabric.Point} point Point to be added to points array
//    */
//   _addPoint: function(point) {
//     if (this._points.length > 1 && point.eq(this._points[this._points.length - 1])) {
//       return false;
//     }
//     this._points.push(point);
//     return true;
//   },
//   /**
//    * Clear points array and set contextTop canvas style.
//    * @private
//    */
//   _reset: function() {
//     this._points = [];
//     this._setBrushStyles();
//     this._setShadow();
//   },
//   /**
//    * @private
//    * @param {Object} pointer Actual mouse position related to the canvas.
//    */
//   _captureDrawingPath: function(pointer) {
//     var pointerPoint = new fabric.Point(pointer.x, pointer.y);
//     return this._addPoint(pointerPoint);
//   },
//   /**
//    * Draw a smooth path on the topCanvas using quadraticCurveTo
//    * @private
//    */
//   _render: function() {
//     var ctx  = this.canvas.contextTop, i, len,
//         p1 = this._points[0],
//         p2 = this._points[1];
//     this._saveAndTransform(ctx);
//     ctx.beginPath();
//     //if we only have 2 points in the path and they are the same
//     //it means that the user only clicked the canvas without moving the mouse
//     //then we should be drawing a dot. A path isn't drawn between two identical dots
//     //that's why we set them apart a bit
//     if (this._points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
//       var width = this.width / 1000;
//       p1 = new fabric.Point(p1.x, p1.y);
//       p2 = new fabric.Point(p2.x, p2.y);
//       p1.x -= width;
//       p2.x += width;
//     }
//     ctx.moveTo(p1.x, p1.y);
//     for (i = 1, len = this._points.length; i < len; i++) {
//       // we pick the point between pi + 1 & pi + 2 as the
//       // end point and p1 as our control point.
//       this._drawSegment(ctx, p1, p2);
//       p1 = this._points[i];
//       p2 = this._points[i + 1];
//     }
//     // Draw last line as a straight line while
//     // we wait for the next point to be able to calculate
//     // the bezier control point
//     ctx.lineTo(p1.x, p1.y);
//     ctx.stroke();
//     ctx.restore();
//   },
//   /**
//    * Converts points to SVG path
//    * @param {Array} points Array of points
//    * @return {String} SVG path
//    */
//   convertPointsToSVGPath: function(points) {
//     var path = [], i, width = this.width / 1000,
//         p1 = new fabric.Point(points[0].x, points[0].y),
//         p2 = new fabric.Point(points[1].x, points[1].y),
//         len = points.length, multSignX = 1, multSignY = 0, manyPoints = len > 2;
//     if (manyPoints) {
//       multSignX = points[2].x < p2.x ? -1 : points[2].x === p2.x ? 0 : 1;
//       multSignY = points[2].y < p2.y ? -1 : points[2].y === p2.y ? 0 : 1;
//     }
//     path.push('M ', p1.x - multSignX * width, ' ', p1.y - multSignY * width, ' ');
//     for (i = 1; i < len; i++) {
//       if (!p1.eq(p2)) {
//         var midPoint = p1.midPointFrom(p2);
//         // p1 is our bezier control point
//         // midpoint is our endpoint
//         // start point is p(i-1) value.
//         path.push('Q ', p1.x, ' ', p1.y, ' ', midPoint.x, ' ', midPoint.y, ' ');
//       }
//       p1 = points[i];
//       if ((i + 1) < points.length) {
//         p2 = points[i + 1];
//       }
//     }
//     if (manyPoints) {
//       multSignX = p1.x > points[i - 2].x ? 1 : p1.x === points[i - 2].x ? 0 : -1;
//       multSignY = p1.y > points[i - 2].y ? 1 : p1.y === points[i - 2].y ? 0 : -1;
//     }
//     path.push('L ', p1.x + multSignX * width, ' ', p1.y + multSignY * width);
//     return path;
//   },
//   /**
//    * Creates fabric.Path object to add on canvas
//    * @param {String} pathData Path data
//    * @return {fabric.Path} Path to add on canvas
//    */
//   createPath: function(pathData) {
//     var path = new fabric.Path(pathData, {
//       fill: null,
//       stroke: this.color,
//       strokeWidth: this.width,
//       strokeLineCap: this.strokeLineCap,
//       strokeMiterLimit: this.strokeMiterLimit,
//       strokeLineJoin: this.strokeLineJoin,
//       strokeDashArray: this.strokeDashArray,
//     });
//     if (this.shadow) {
//       this.shadow.affectStroke = true;
//       path.setShadow(this.shadow);
//     }
//     return path;
//   },
//   /**
//    * Decimate poins array with the decimate value
//    */
//   decimatePoints: function(points, distance) {
//     if (points.length <= 2) {
//       return points;
//     }
//     var zoom = this.canvas.getZoom(), adjustedDistance = Math.pow(distance / zoom, 2),
//         i, l = points.length - 1, lastPoint = points[0], newPoints = [lastPoint],
//         cDistance;
//     for (i = 1; i < l; i++) {
//       cDistance = Math.pow(lastPoint.x - points[i].x, 2) + Math.pow(lastPoint.y - points[i].y, 2);
//       if (cDistance >= adjustedDistance) {
//         lastPoint = points[i];
//         newPoints.push(lastPoint);
//       }
//     }
//     if (newPoints.length === 1) {
//       newPoints.push(new fabric.Point(newPoints[0].x, newPoints[0].y));
//     }
//     return newPoints;
//   },
//   /**
//    * On mouseup after drawing the path on contextTop canvas
//    * we use the points captured to create an new fabric path object
//    * and add it to the fabric canvas.
//    */
//   _finalizeAndAddPath: function() {
//     var ctx = this.canvas.contextTop;
//     ctx.closePath();
//     if (this.decimate) {
//       this._points = this.decimatePoints(this._points, this.decimate);
//     }
//     var pathData = this.convertPointsToSVGPath(this._points).join('');
//     if (pathData === 'M 0 0 Q 0 0 0 0 L 0 0') {
//       // do not create 0 width/height paths, as they are
//       // rendered inconsistently across browsers
//       // Firefox 4, for example, renders a dot,
//       // whereas Chrome 10 renders nothing
//       this.canvas.requestRenderAll();
//       return;
//     }
//     var path = this.createPath(pathData);
//     this.canvas.clearContext(this.canvas.contextTop);
//     this.canvas.add(path);
//     this.canvas.requestRenderAll();
//     path.setCoords();
//     this._resetShadow();
//     // fire event 'path' created
//     this.canvas.fire('path:created', { path: path });
//   }
// });

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
      socket.emit('mouse',data)
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
      socket.emit('mouse',data)
      undoOrRedoLock = false
    }
  }
}


function changeContextTop(input){

  canvas.contexTop = input
}

canvas.on(
  'object:added', function(){
    if(canvasLock === false)
      {
      updateCanvasState();
      if( undoOrRedoLock === false)
      { 
          var data = canvas.toJSON()
          socket.emit('mouse',data)
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
  socket.emit('mouse',data)
  undoOrRedoLock = false

}
 
 )

 eraserButton.click(function(){
   canvas.freeDrawingBrush.color = "#ffffff";
   
   canvas.freeDrawingBrush.width = 10;
 })


socket.on('mouse',(data)=>{

  canvasLock = true
  var canvasAsJson = JSON.stringify(data);
  canvas.loadFromJSON(canvasAsJson)
  canvas.renderAll();
})

//    END OF CANVAS
// ===================