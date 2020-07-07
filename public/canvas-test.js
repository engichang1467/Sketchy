const canvas = document.getElementById('draw-area');
let isMouseDown = false;
const context = canvas.getContext('2d');
var eraser = document.getElementById('eraser-tool');
var colourWheel = document.getElementById('colour-wheel');
var selectedColor = colourWheel.value
var colour = selectedColor;
var slider = document.getElementById('brush-size');
var clear = document.getElementById('clear')
var brushSize = 1;
let x,y = 0;

slider.addEventListener('input',function(evt){
    brushSize = this.value;
})
colourWheel.addEventListener('input', function(evt){
    colour = this.value;
})
clear.addEventListener('click',function(evt){
    context.clearRect(0,0,canvas.width,canvas.height)
})
eraser.addEventListener('click', function(evt){
    colour = 'white';
})
canvas.addEventListener('mousedown',(evt)=>{

    x = evt.offsetX;
    y = evt.offsetY;
    isMouseDown = true;
    context.lineJoin = context.lineCap = 'round'


})


canvas.addEventListener('mousemove',(evt)=>{

    if(isMouseDown){
        console.log("MOUSE DOWN")
        draw(context,x,y,evt.offsetX, evt.offsetY);
        x = evt.offsetX;
        y = evt.offsetY;
    }



});

window.addEventListener('mouseup',(evt)=>{
    if (isMouseDown){
        draw(context,x,y,evt.offsetX, evt.offsetY);
        x = 0;
        y = 0;
        isMouseDown = false;
    }
})

function draw(context,x,y,x2,y2){
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = brushSize;
    context.moveTo(x, y);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

