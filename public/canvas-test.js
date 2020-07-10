window.onload = function () {
    const canvas = document.getElementById('draw-area');
    const context = canvas.getContext('2d');

    let isMouseDown = false;

    var eraser = document.getElementById('eraser-tool');
    var colorWheel = document.getElementById('color-wheel');
    var undoButton = document.getElementById('undo');
    var selectedColor = '#000';
    var color = selectedColor;
    var slider = document.getElementById('brush-size');
    var clear = document.getElementById('clear')
    var brushSize = 1;
    let x,y = 0;
    let tempStack = [];
    let undoStack= [];

    // slider.addEventListener('input',function(evt){
    //     brushSize = this.value;
    // })
    // colorWheel.addEventListener('input', function(evt){
    //     color = this.value;
    // })
    // clear.addEventListener('click',function(evt){
    //     context.clearRect(0,0,canvas.width,canvas.height)
    // })
    // eraser.addEventListener('click', function(evt){
    //     color = 'white';
    // })

    // undoButton.addEventListener('click', (evt)=>{
    //     undoStack.pop();
    //     undoStack.pop();

    //     context.clearRect(0,0,canvas.width,canvas.height)
    //     undoStack.forEach(path=>{
    //         // context.lineJoin = context.lineCap = 'round';
    //         context.beginPath();
    //         context.strokeStyle = path[0].color;
    //         context.lineWidth = path[0].brushSize;
    //         context.moveTo(path[0].x,path[0].y);
    //         for(let i = 1; i < path.length; i++){
    //             context.lineTo(path[i].x,path[i].y);
    //         }
    //         context.stroke();
    //     })
    // })
    canvas.addEventListener('mousedown',(evt)=>{

        x = evt.offsetX;
        y = evt.offsetY;
        isMouseDown = true;
        context.lineJoin = context.lineCap = 'round'
        tempStack = [];

        tempStack.push({x,y,color,brushSize})




    })


    canvas.addEventListener('mousemove',(evt)=>{

        if(isMouseDown){
            console.log("MOUSE DOWN")
            draw(context,x,y,evt.offsetX, evt.offsetY);
            x = evt.offsetX;
            y = evt.offsetY;
            tempStack.push({x,y,color,brushSize})

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
        context.strokeStyle = color;
        context.lineWidth = brushSize;
        context.moveTo(x, y);
        context.lineTo(x2, y2);
        context.stroke();
        context.closePath();
    }

}



