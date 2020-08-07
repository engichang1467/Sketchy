
var room1 = document.getElementById('lobby-1');
var room2 = document.getElementById('lobby-2');
var room3 = document.getElementById('lobby-3');

room1.addEventListener('click',function(evt){
    window.location.href = './game/1';
})
room2.addEventListener('click',function(evt){
    window.location.href = '/game/2';
})
room3.addEventListener('click',function(evt){
    window.location.href = './game/3';
})

var logoutbutton = document.querySelector('.logout-button')
logoutbutton.addEventListener('click',function(evt){
    var chime = new Audio('/sound/negative-alert.wav')
    chime.volume = 0.5
    chime.play();
    window.location.href = './logout';
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 
 

var createButton = document.querySelector('.create-game-card');
createButton.addEventListener('click',function(evt){
    window.location.href = `./game/${makeid(5)}`;
})