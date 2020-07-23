window.onload=function(){

  // function hexToRgb(hex) {
  //   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  //   return result ? {
  //     r: parseInt(result[1], 16),
  //     g: parseInt(result[2], 16),
  //     b: parseInt(result[3], 16)
  //   } : null;
  // }

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

    


      
      
}


// Below are just attempts for paint bucket will look attempt in the future if we have time. If not, we can just make it a filled-in image
// var colorz = "#b7b71a"
//  $('#my-paintbucket-btn').paintbucket('#draw-area');

// $('#my-paintbucket-btn').data('fill-color', colorz);

//  $('.colorpicker-input').colorpicker().on('changeColor.colorpicker', function (event) {
//   $('#my-paintbucket-btn').data('fill-color', event.color.toHex());
// });



     //Change from drawing mode to paintbucket mode
    // fillButton.click(function(){
    //   if (canvas.isDrawingMode)
    //   {
    //     canvas.isDrawingMode = false;
    //     isFillOn = true;
        
    //   }
    //   else
    //   {
        
    //     canvas.isDrawingMode = true;
    //     isFillOn = false;
    //   }
    // })

   

    // var outlineLayerData = context.getImageData(0, 0, 840, 640);
    // var colorLayerData = context.getImageData(0, 0, 840, 640);
    // var matchOutlineColor = function (r, g, b, a) {

		// 	return (r + g + b < 100 && a === 255);
		// }
    //  var matchStartColor = function (pixelPos, startR, startG, startB) {

		// 	var r = outlineLayerData.data[pixelPos],
		// 		g = outlineLayerData.data[pixelPos + 1],
		// 		b = outlineLayerData.data[pixelPos + 2],
		// 		a = outlineLayerData.data[pixelPos + 3];

		// 	// If current pixel of the outline image is black
		// 	if (matchOutlineColor(r, g, b, a)) {
		// 		return false;
		// 	}

		// 	r = colorLayerData.data[pixelPos];
		// 	g = colorLayerData.data[pixelPos + 1];
		// 	b = colorLayerData.data[pixelPos + 2];

		// 	// If the current pixel matches the clicked color
		// 	if (r === startR && g === startG && b === startB) {
		// 		return true;
		// 	}

		// 	// If current pixel matches the new color
		// 	if (r === curColor.r && g === curColor.g && b === curColor.b) {
		// 		return false;
		// 	}

		// 	return true;
		// }

    // var colorPixel = function (pixelPos, r, g, b, a) {

		// 	colorLayerData.data[pixelPos] = r;
		// 	colorLayerData.data[pixelPos + 1] = g;
		// 	colorLayerData.data[pixelPos + 2] = b;
		// 	colorLayerData.data[pixelPos + 3] = a !== undefined ? a : 255;
		// }
    // var floodFill = function (startX, startY, startR, startG, startB) {
    //   var canvasWidth = canvasHtml.getBoundingClientRect().width
    //   var newPos,
    //     x,
    //     y,
    //     pixelPos,
    //     reachLeft,
    //     reachRight,
    //     drawingBoundLeft = canvasHtml.getBoundingClientRect().x,
    //     drawingBoundTop = canvasHtml.getBoundingClientRect().y,
    //     drawingBoundRight = canvasHtml.getBoundingClientRect().x + canvasHtml.getBoundingClientRect().width,
    //     drawingBoundBottom = canvasHtml.getBoundingClientRect().y + canvasHtml.getBoundingClientRect().height,
    //     pixelStack = [[startX, startY]];
    
    //   while (pixelStack.length) {
    
    //     // console.log("Looping")
    //     newPos = pixelStack.pop();
    //     x = newPos[0];
    //     y = newPos[1];
    
    //     // Get current pixel position
    //     pixelPos = y;
        
        
    //     // Go up as long as the color matches and are inside the canvas
    //     while (y >= drawingBoundTop && matchStartColor(pixelPos, startR, startG, startB)) {
    //       y -= 1;
    //       // console.log("Y Value: " + y)
    //       // console.log("Bound Value" + drawingBoundTop)
    //       // console.log("ERROR")
          
    //     }
    
    //     // pixelPos += canvasWidth * 4;
    //     y += 1;
    //     reachLeft = false;
    //     reachRight = false;
    
    //     // Go down as long as the color matches and in inside the canvas
    //     while (y <= drawingBoundBottom && matchStartColor(pixelPos, startR, startG, startB)) {
    //       y += 1;
    
    //       colorPixel(pixelPos, curColor.r, curColor.g, curColor.b);
    
    //       if (x > drawingBoundLeft) {
    //         if (matchStartColor(pixelPos - 4, startR, startG, startB)) {
    //           if (!reachLeft) {
    //             // Add pixel to stack
    //             pixelStack.push([x - 1, y]);
    //             reachLeft = true;
    //           }
    //         } else if (reachLeft) {
    //           reachLeft = false;
    //         }
    //       }
    
    //       if (x < drawingBoundRight) {
    //         if (matchStartColor(pixelPos + 4, startR, startG, startB)) {
    //           if (!reachRight) {
    //             // Add pixel to stack
    //             pixelStack.push([x + 1, y]);
    //             reachRight = true;
    //           }
    //         } else if (reachRight) {
    //           reachRight = false;
    //         }
    //       }
    
    //       // pixelPos += canvasWidth * 4;
    //     }
    //   }
    // }


    // var fillBucket = function (startX, startY, startR, startG, startB){
    //   var canvasWidth = canvasHtml.getBoundingClientRect().width
    //   var newPos,
    //     x,
    //     y,
    //     pixelPos,
    //     reachLeft,
    //     reachRight,
    //     drawingBoundLeft = canvasHtml.getBoundingClientRect().x,
    //     drawingBoundTop = canvasHtml.getBoundingClientRect().y,
    //     drawingBoundRight = canvasHtml.getBoundingClientRect().x + canvasHtml.getBoundingClientRect().width,
    //     drawingBoundBottom = canvasHtml.getBoundingClientRect().y + canvasHtml.getBoundingClientRect().height,
    //     pixelStack = [[startX, startY]];


    //   while(pixelStack.length >=0){
    //     newPos = pixelStack.pop();
    //     x = newPos[0];
    //     y = newPos[1];


    //   }
    // }

    // canvas.on('mouse:down', function(evt){

      
    //   if(isFillOn){
    //     var mouseInfo = canvas.getPointer(evt.e)
    //     var xPos= parseInt(mouseInfo.x);
    //     var yPos = parseInt(mouseInfo.y);
    //     var pixel = context.getImageData(xPos,yPos,1,1).data;
 
    //    // tester(xPos,yPos,pixel[0],pixel[1],pixel[2])
    //    // console.log(curColor)
    //   }
    //  })
 