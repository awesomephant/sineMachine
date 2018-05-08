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

http.listen(3000, function () {
    console.log('listening on *:3000');
});

var setMicrostep = function (resolution, ms1, ms2) {
	if (resolution === "full") {
        ms1.low();
        ms2.low();
        console.log("Set microstep resolution to " + resolution);
    } else if (resolution === "half") {
        ms1.high();
        ms2.low();
        console.log("Set microstep resolution to " + resolution);
    } else if (resolution === "quarter") {
        ms1.low();
        ms2.high();
        console.log("Set microstep resolution to " + resolution);
    } else if (resolution === "eighth") {
        ms1.high();
        ms2.high();
        console.log("Set microstep resolution to " + resolution);
    } else {
        console.log("Invalid microstep resolution: " + resolution);
        return null;
    }
};
var five = require("johnny-five"),
    board, potentiometer;

board = new five.Board();

var controlsA = {
    a: 80,
    f: .005,
    offset: 300,
    ft: 'sin',
    name: 'A',
    offsetX: 0
}
var controlsB = {
    a: 80,
    f: .005,
    offset: 300,
    ft: 'triangle',
    name: 'B',
    offsetX: 1,
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

var moveStepperTo = function (stepper, n, cb) {
    stepper.isMoving = true;
    let delta = 0;
    let direction = null;
    delta = (n - stepper.currentPosition);
    if (delta > 0) {
        direction = 1;
    } else {
        direction = 0;
    }
    let speed = config.maxRPM;

    //    console.log('Moving by ' + delta + ' steps');
    stepper.rpm(speed).direction(direction).step(Math.abs(delta * 5), function () {
        stepper.currentPosition += delta;
        stepper.isMoving = false;
        io.emit('stepper ' + stepper.max_name + ' status', stepper.currentPosition)
        cb();
    });
}

board.on("ready", function () {
    io.on('connection', function (socket) {
        console.log('A user connected');
        io.emit('update a', controlsA)
        io.emit('update b', controlsB)
        socket.on('functionStep', (data, fn) => {
            if (stepperA.isMoving === false) {
                moveStepperTo(stepperA, data.a, function () { })
            }
            if (stepperB.isMoving === false) {
                moveStepperTo(stepperB, data.b, function () { })
            }
        });
    });
    var ms1 = new five.Pin(13);
    var ms2 = new five.Pin(12);
    setMicrostep("full", ms1, ms2);

    // Steppers
    var stepperA = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 200,
        pins: {
            step: 10,
            dir: 11
        }
    });

    stepperA.currentPosition = 0;
    stepperA.isMoving = false;
    stepperA.max_name = 'a';
    var stepperB = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 200,
        pins: {
            step: 8,
            dir: 9
        }
    });

    stepperB.currentPosition = 0;
    stepperB.isMoving = false;
    stepperB.max_name = 'b'
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
        controlsA.a = this.scaleTo(0, 200);
        io.emit('update a', controlsA)
    });
    p1.on("change", function () {
        controlsA.f = this.scaleTo(0, 400) / 10000;
        io.emit('update a', controlsA)
    });
    p2.on("change", function () {
        if (config.aOffsetAxis === 'y') {
            controlsA.offset = this.scaleTo(00, 500);
        } else {
            controlsA.offsetX = this.scaleTo(0, 200) / 1000;
        }
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
        if (config.bOffsetAxis === 'y') {
            controlsB.offset = this.scaleTo(00, 500);
        } else {
            controlsB.offsetX = this.scaleTo(0, 200) / 1000;
        }
        io.emit('update b', controlsB)
    });

});
