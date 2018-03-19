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
    res.sendFile(__dirname + '/largescale-control.html');
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
        console.log('Connection established');
        socket.on('functionStep', (data, fn) => {
            console.log('Update received')
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
});
