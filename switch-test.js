var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function () {

    var switches = new five.Switches([8, 9]);
    switches.on("open", function () {
        console.log(this.pin + 'open')
    });
    switches.on("close", function () {
        console.log(this.pin + 'close')
    });
});