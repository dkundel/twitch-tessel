// These two dependencies remain the same
var tessel = require('tessel');
var http = require('http');
var localtunnel = require('localtunnel');

var Tessel = require("tessel-io");
var five = require('johnny-five');
var board = new five.Board({
  io: new Tessel()
});

var leds = new five.Leds(["a5", "a6", "a7", 'a3']);
var button = new five.Button('a4');
var statusLeds = [false, false, false];
var isButtonPressed = false;

// Require two other core Node.js modules
var fs = require('fs');
var url = require('url');

var server = http.createServer(function (request, response) {
  // Break up the url into easier-to-use parts
  var urlParts = url.parse(request.url, true);

  // Create a regular expression to match requests to toggle LEDs
  var incomingRegex = /incoming/;

  if (urlParts.pathname.match(incomingRegex)) {
    leds[3].toggle();
    response.writeHead(200, {"Content-Type": "text/xml"});
    response.end('<Response></Response>');
  } else {
    // All other request will call a function, showIndex
    showIndex(urlParts.pathname, request, response);
  }
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('button', isButtonPressed);
  socket.on('toggle-led', toggleLED);
});

board.on('ready', () => {

  button.on("press", () => {
    console.log("Button Pressed!");
    isButtonPressed = true;
    io.emit('button', isButtonPressed);
  });
  button.on("release", () => {
    console.log("Button Released!");
    isButtonPressed = false;
    io.emit('button', isButtonPressed);
  });

  // Stays the same
  server.listen(8080, () => {
    // Stays the same
    console.log(require('os').networkInterfaces());
    console.log('Server running at Port 8080');
    var tunnel = localtunnel(8080, function(err, tunnel) {
        if (err) {
          console.error('Some err!')
          console.error(err);
        }

        // the assigned public url for your tunnel
        // i.e. https://abcdefgjhij.localtunnel.me
        console.log('Tunnel url:' + tunnel.url);
    });
  });

});

// Respond to the request with our index.html page
function showIndex (url, request, response) {
  // Create a response header telling the browser to expect html
  response.writeHead(200, {"Content-Type": "text/html"});

  // Use fs to read in index.html
  fs.readFile(__dirname + '/index.html', function (err, content) {
    // If there was an error, throw to stop code execution
    if (err) {
      throw err;
    }

    // Serve the content of index.html read in by fs.readFile
    response.end(content);
  });
}

// Toggle the led specified in the url and respond with its state
function toggleLED (index) {
  var led = leds[index];

  // Toggle the state of the led and call the callback after that's done
  led.toggle();
  statusLeds[index] = !statusLeds[index];
  io.emit('led-status', statusLeds);
}