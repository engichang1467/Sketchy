# Sketchy

![logo](img/logo.png)

multiplayer drawing and guessing web game

For local testing:

Index.js:
Line 607 must be: const io = require('socket.io')(3000);

Socket.js:
Uncomment: const socket = io('http://localhost:3000’);
Comment out the server line.

to run tests, run:
npm test

to run locally, ensure dependencies are installed and run:
npm run devStart
