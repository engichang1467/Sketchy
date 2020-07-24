var session = JSON.parse($('#sessionJSON').text());
$('#sessionJSON').remove();

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');



socket.emit('addUserToRoom', {session})


// Message from server

socket.on('message',message => {
  console.log(message);
  outputMessage(message);

  //Scroll down the chatbox automatically
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  // Get message text
  const msg = e.target.elements.msg.value;

  // Emit message to server
  socket.emit('chatMessage',msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
})

// Output message to document
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message'); // create div class 'message'
  div.innerHTML = `<p class="meta">${message.username}</p><p class="text">${message.content}</p>`;
  document.querySelector('.chat-messages').appendChild(div);


}