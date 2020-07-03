const canvas = document.getElementById('draw-area');
let isMouseDown = false;
const context = canvas.getContext('2d');
var colour = 'black';
let x,y = 0;
let colours = document.querySelectorAll('#colour-picker > *');

for(let i = 0; i < colours.length; i++){
    colours[i].addEventListener('click',function(evt){
        colour = this.id
    }
    )
}
canvas.addEventListener('mousedown',(evt)=>{

    x = evt.offsetX;
    y = evt.offsetY;
    isMouseDown = true;


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
    context.lineWidth = 1;
    context.moveTo(x, y);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}