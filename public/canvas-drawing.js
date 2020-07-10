window.onload=function(){
    var canvas = new fabric.Canvas('draw-area');
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = "#ff0000";
    var clear = document.getElementById('tool-clear')
    canvas.on('mouse:up', function() {
        canvas.getObjects().forEach(o => {
          o.fill = 'blue'
        });
        canvas.renderAll();
      })
      var clearEl = $(document.getElementById('tool-clear'));
      console.log(clearEl)
      clearEl.click(function() { console.log('clear'); canvas.clear() })
      
}


