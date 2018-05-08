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
app.get('/sim', function (req, res) {
    res.sendFile(__dirname + '/sim.html');
});
app.get('/controls', function (req, res) {
    res.sendFile(__dirname + '/controls.html');
});
app.get('/result', function (req, res) {
    res.sendFile(__dirname + '/result.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

var five = require("johnny-five"),
    board, potentiometer;

board = new five.Board();

var controlsA = {
    a: 80,
    f: .005,
    offset: 300,
    ft: 'sin',
    name: 'A',
    offsetX: 0,
    phi: 0
}
var controlsB = {
    a: 80,
    f: .005,
    offset: 300,
    ft: 'triangle',
    name: 'B',
    offsetX: 1,
    phi: 0
}
var config = {
    maxRPM: 120,
    aOffsetAxis: 'y',
    bOffsetAxis: 'y'
}
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

board.on("ready", function () {
    io.on('connection', function (socket) {
        console.log('A user connected');
        io.emit('update a', controlsA)
        io.emit('update b', controlsB)
    });
    let pfreq = 50;
    p0 = new five.Sensor({
        pin: "A0",
        freq: pfreq
    });
    p1 = new five.Sensor({
        pin: "A1",
        freq: pfreq
    });
    p2 = new five.Sensor({
        pin: "A2",
        freq: pfreq
    });
    p3 = new five.Sensor({
        pin: "A3",
        freq: pfreq
    });
    p4 = new five.Sensor({
        pin: "A4",
        freq: pfreq
    });
    p5 = new five.Sensor({
        pin: "A5",
        freq: pfreq
    });

    var a0 = new five.Switch(7)
    var a1 = new five.Switch(6)
    var b0 = new five.Switch(5)
    var b1 = new five.Switch(4)
    var c0 = new five.Switch(3)
    var c1 = new five.Switch(2)

    var binarySwitch = [0, 0]
    var binarySwitchB = [0, 0]
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

    // Switch offset knob from x to y

    c0.on("open", function (e) {
        config.aOffsetAxis = 'x';
    });
    c0.on("close", function (e) {
        config.aOffsetAxis = 'y';
    });

    c1.on("open", function (e) {
        config.bOffsetAxis = 'x';
    });
    c1.on("close", function (e) {
        config.bOffsetAxis = 'y';
    });


    // Potentiometers

    p0.on("change", function () {
        controlsA.a = this.fscaleTo(0, 200) - 10;
        io.emit('update a', controlsA)
    });
    p1.on("change", function () {
        //controlsA.f = this.fscaleTo(0, .04);
        //io.emit('update a', controlsA)
    });
    p2.on("change", function () {
        if (config.aOffsetAxis === 'y') {
            controlsA.offset = this.fscaleTo(0, 600);
        } else {
            controlsA.offsetX = this.fscaleTo(0, 2);
        }
        io.emit('update a', controlsA)
    });
    p3.on("change", function () {
        controlsB.a = this.fscaleTo(0, 200) - 10;
        io.emit('update b', controlsB)
    });
    p4.on("change", function () {
        //controlsB.f = this.fscaleTo(0, .04);
        //io.emit('update b', controlsB)
    });
    p5.on("change", function () {
        if (config.bOffsetAxis === 'y') {
            controlsB.offset = this.fscaleTo(00, 600);
        } else {
            controlsB.offsetX = this.fscaleTo(0, 2);
        }
        io.emit('update b', controlsB)
    });

});
