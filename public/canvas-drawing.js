window.onload=function(){

    var canvas = new fabric.Canvas('draw-area');

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = "#ff0000";
    var clear = document.getElementById('tool-clear')

    //Initializing tools for the undo and redo items
    var canvasState = [];
    var indexTracker = -1;
    var undoStatus = false; //A lock for the undo status to solve some concurrency issues between undo and update canvas
    var redoStatus = false; //A lock for the undo status to solve some concurrency issues between redo and update canvas
    var undoButton = $(document.getElementById('tool-undo'));
    var redoButton = $(document.getElementById('tool-redo'));
    var undoLock =true; //A lock for the undo status to solve the spamming of undo
    var redoLock =true; //A lock for the redo status to solve the spamming of redo


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
      }
    );


    var clearEl = $(document.getElementById('tool-clear'));
      
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

      
      
}


