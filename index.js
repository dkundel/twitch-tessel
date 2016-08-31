// These two dependencies remain the same
var tessel = require('tessel');
var http = require('http');
var localtunnel = require('localtunnel');

var Tessel = require("tessel-io");
var five = require('johnny-five');
var board = new five.Board({
  io: new Tessel()
});

var leds = new five.Leds(["a5", "a6", "a7"]);
var statusLeds = [false, false, false];


// Require two other core Node.js modules
var fs = require('fs');
var url = require('url');

var server = http.createServer(function (request, response) {
  // Break up the url into easier-to-use parts
  var urlParts = url.parse(request.url, true);

  // Create a regular expression to match requests to toggle LEDs
  var ledRegex = /leds/;

  if (urlParts.pathname.match(ledRegex)) {
    // If there is a request containing the string 'leds' call a function, toggleLED
    toggleLED(urlParts.pathname, request, response);
  } else {
    // All other request will call a function, showIndex
    showIndex(urlParts.pathname, request, response);
  }
});

board.on('ready', () => {
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
function toggleLED (url, request, response) {
  // Create a regular expression to find the number at the end of the url
  var indexRegex = /(\d)$/;

  // Capture the number, returns an array
  var result = indexRegex.exec(url);

  // Grab the captured result from the array
  var index = result[1];

  // Use the index to refence the correct LED
  var led = leds[index];

  // Toggle the state of the led and call the callback after that's done
  led.toggle();
  statusLeds[index] = !statusLeds[index];
  // The led was successfully toggled, respond with the state of the toggled led using led.isOn
  response.writeHead(200, {"Content-Type": "application/json"});
  response.end(JSON.stringify({on: statusLeds[index]}));
}