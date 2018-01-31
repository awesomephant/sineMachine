var gri = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
var gra = function (min, max) {
    return Math.random() * (max - min) + min;
}
const express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('A user connected');
    io.emit('update a', controlsA)
    io.emit('update b', controlsB)
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

var five = require("johnny-five"),
    board, potentiometer;
    
    board = new five.Board();
    
    var controlsA = {
        a: 70,
        f: .005,
        offset: 300,
        ft: 'sin'
    }
    var controlsB = {
        a: 70,
        f: .005,
    offset: 300,
    ft: 'triangle'
}
board.on("ready", function () {
    p0 = new five.Sensor({
        pin: "A0",
        freq: 25
    });
    p1 = new five.Sensor({
        pin: "A1",
        freq: 25
    });
    p2 = new five.Sensor({
        pin: "A2",
        freq: 25
    });
    p3 = new five.Sensor({
        pin: "A3",
        freq: 25
    });
    p4 = new five.Sensor({
        pin: "A4",
        freq: 25
    });
    p5 = new five.Sensor({
        pin: "A5",
        freq: 25
    });

    var a0 = new five.Switch(6)
    var a1 = new five.Switch(7)
    var b0 = new five.Switch(8)
    var b1 = new five.Switch(9)

    var binarySwitch = [0, 0]
    var binarySwitchB = [0, 0]

    var queryBinarySwitch = function (s) {
        let binary = s.join('');
        let n = parseInt(binary, 2)
        if (n === 0) {
            return 'sin'

        } else if (n === 1) {
            return 'triangle'

        } else if (n === 2) {
            return 'square'

        } else if (n === 3) {
            return 'sawtooth'
        }
    }

    // Binary function switcher

    a0.on("open", function (e) {
        binarySwitch[0] = 0
        controlsA.ft = queryBinarySwitch(binarySwitch)
        io.emit('update a', controlsA)
    });
    a0.on("close", function (e) {
        binarySwitch[0] = 1
        controlsA.ft = queryBinarySwitch(binarySwitch)
        io.emit('update a', controlsA)
    });
    a1.on("open", function (e) {
        binarySwitch[1] = 0
        controlsA.ft = queryBinarySwitch(binarySwitch)
        io.emit('update a', controlsA)
    });
    a1.on("close", function (e) {
        binarySwitch[1] = 1
        controlsA.ft = queryBinarySwitch(binarySwitch)
        io.emit('update a', controlsA)
    });
    b0.on("open", function (e) {
        binarySwitchB[0] = 0
        controlsB.ft = queryBinarySwitch(binarySwitchB)
        io.emit('update b', controlsB)
    });
    b0.on("close", function (e) {
        binarySwitchB[0] = 1
        controlsB.ft = queryBinarySwitch(binarySwitchB)
        io.emit('update b', controlsB)
    });
    b1.on("open", function (e) {
        binarySwitchB[1] = 0
        controlsB.ft = queryBinarySwitch(binarySwitchB)
        io.emit('update b', controlsB)
    });
    b1.on("close", function (e) {
        binarySwitchB[1] = 1
        controlsB.ft = queryBinarySwitch(binarySwitchB)
        io.emit('update b', controlsB)
    });

    // Potentiometers

    p0.on("change", function () {
        controlsA.a = this.scaleTo(0, 200);
        io.emit('update a', controlsA)
    });
    p1.on("change", function () {
        controlsA.f = this.scaleTo(0, 400) / 10000;
        console.log(controlsA.f)
        io.emit('update a', controlsA)
    });
    p2.on("change", function () {
        controlsA.offset = this.scaleTo(-200, 200);
        io.emit('update a', controlsA)
    });
    p3.on("change", function () {
        controlsB.a = this.scaleTo(0, 200);
        io.emit('update b', controlsB)
    });
    p4.on("change", function () {
        controlsB.f = this.scaleTo(0, 400) / 10000;
        io.emit('update b', controlsB)
    });
    p5.on("change", function () {
        controlsB.offset = this.scaleTo(-200, 200);
        io.emit('update b', controlsB)
    });
});
