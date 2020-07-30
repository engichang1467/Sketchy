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