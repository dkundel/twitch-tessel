'use strict';

// Node.js dependencies
var fs = require('fs');
var http = require('http');
var os = require('os');
var url = require('url');

// External dependencies
var five = require('johnny-five');
var localtunnel = require('localtunnel');
var socketIo = require('socket-io');
var tessel = require('tessel');
var TesselIo = require('tessel-io');

// Hardware components
var board = new five.Board({
  io: new TesselIo()
});
var leds = new five.Leds(['a3', 'a4', 'a5', 'a6']);
var button = new five.Button('a7');

// Globals
var IS_BUTTON_PRESSED = false;
var PORT = process.env.PORT || 8080;
var STATUS_LEDS = [false, false, false];

// Connections
var server = setupServer();
var io = socketIo(server);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('button', IS_BUTTON_PRESSED);
  socket.on('toggle-led', toggleLED);
});

board.on('ready', () => {
  addEventListeners();

  server.listen(PORT, () => {
    console.log('Server running on port %d', PORT);
    var tunnel = setupTunnel(PORT);
  })
});

function setupServer() {
  return http.createServer(function (request, response) {
    var urlParts = url.parse(request.url, true);
    var incomingRegex = /incoming/;

    if (urlParts.pathname.match(incomingRegex)) {
      leds[3].toggle();
      response.writeHead(200, {'Content-Type': 'text/xml'});
      response.end('<Response></Response>');
    } else {
      showIndex(urlParts.pathname, request, response);
    }
  });
}

function setupTunnel(port) {
  return localtunnel(8080, function(err, tunnel) {
    if (err) {
      console.error('Some err!')
      console.error(err);
    }

    // the assigned public url for your tunnel
    // i.e. https://abcdefgjhij.localtunnel.me
    console.log('Tunnel url:' + tunnel.url);
  });
}

function addEventListeners() {
  button.on('press', () => {
    console.log('Button Pressed!');
    IS_BUTTON_PRESSED = true;
    io.emit('button', IS_BUTTON_PRESSED);
  });
  button.on('release', () => {
    console.log('Button Released!');
    IS_BUTTON_PRESSED = false;
    io.emit('button', IS_BUTTON_PRESSED);
  });
}

function printIpAddress() {
  console.log(os.networkInterfaces());
}

function showIndex (url, request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile(__dirname + '/index.html', function (err, content) {
    if (err) {
      throw err;
    }

    response.end(content);
  });
}

function toggleLED (index) {
  var led = leds[index];

  led.toggle();
  STATUS_LEDS[index] = !STATUS_LEDS[index];
  io.emit('led-status', STATUS_LEDS);
}