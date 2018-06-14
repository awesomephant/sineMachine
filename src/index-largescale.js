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
var stepperA, stepperB;
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/largescale-control.html');
});

http.listen(3001, function () {
    console.log('listening on *:3001');
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

// Use this to set the origin in mm
var status = {
    currentCoordinates: [1300, 1400]
}
var config = {
    maxRPM: 120,
    aOffsetAxis: 'y',
    bOffsetAxis: 'y',
	maxY: 200,
	minY: -200,
    drawingScale: 2,
    useDerivative: false,
    artBoard: {
        width: 200,  //mm (These can be negative so the origin is in the middle of the artboard)
        height: 200,
        x: 10,
        y: 10
    },
    wheelDiameter: 3, //Stepper wheel radius in mm
	stepperAPos: {x: 0, y: 0},
	stepperBPos: {x: 2620, y: 0}
	
}

const intersectCircles = function (x1, y1, r1, x2, y2, r2) {
    var centerdx = x1 - x2;
    var centerdy = y1 - y2;
    var R = Math.sqrt(centerdx * centerdx + centerdy * centerdy);
    if (!(Math.abs(r1 - r2) <= R && R <= r1 + r2)) { // no intersection
        return []; // empty list of results
    }
    // intersection(s) should exist

    var R2 = R * R;
    var R4 = R2 * R2;
    var a = (r1 * r1 - r2 * r2) / (2 * R2);
    var r2r2 = (r1 * r1 - r2 * r2);
    var c = Math.sqrt(2 * (r1 * r1 + r2 * r2) / R2 - (r2r2 * r2r2) / R4 - 1);

    var fx = (x1 + x2) / 2 + a * (x2 - x1);
    var gx = c * (y2 - y1) / 2;
    var ix1 = fx + gx;
    var ix2 = fx - gx;

    var fy = (y1 + y2) / 2 + a * (y2 - y1);
    var gy = c * (x1 - x2) / 2;
    var iy1 = fy + gy;
    var iy2 = fy - gy;

    // note if gy == 0 and gx == 0 then the circles are tangent and there is only one solution
    // but that one solution will just be duplicated as the code is currently written
    return [[ix1, iy1], [ix2, iy2]];
}

/**
 * Converts a number of steps to mm, given the diameter of the output wheels and the microstepping resolution
 * @param {Float} Steps
 * @returns {number} Length in mm
 */
const stepsToLength = function (steps) {
    let c = 2 * Math.PI * Math.pow(config.wheelDiameter, 2);
    let length = steps * (c / (config.stepperResolution * config.microstepResolution))
    return length;
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
//    let speed = config.maxRPM;
    let speed = Math.abs(10 * delta)
    if (speed >= config.maxRPM){
        speed = config.maxRPM
    }
    stepper.rpm(speed).direction(direction).step(Math.abs(delta * 5), function () {
        stepper.currentPosition += delta;
        stepper.isMoving = false;
        io.emit('stepper ' + stepper.max_name + ' status', stepper.currentPosition)
        cb();
    });
}

var setStepperSpeed = function (stepper, s, cb) {
    stepper.isMoving = true;    
	let speed = s * 20; // + 5 so it doesnt get stuck if speed = 5
    let direction = null;
    if (speed > 0) {
		direction = 1
		speed += 2    
	} else {
        direction = 0;
		speed -= 2;
    }

//    console.log('Setting speed to ' + speed);

    stepper.rpm(Math.abs(speed)).direction(direction).step(5, function () { //  5 steps is arbitrary
        stepper.currentPosition += 5 * direction;
        stepper.isMoving = false;
        io.emit('stepper ' + stepper.max_name + ' status', stepper.currentPosition)
        cb();
    });
}


board.on("ready", function () {
    config.artBoard.x += status.currentCoordinates[0];
    config.artBoard.y += status.currentCoordinates[1];
    io.on('connection', function (socket) {
        console.log('Connection established');
        socket.on('functionStep', (data, fn) => {
			if (config.useDerivative){
        	    if (stepperA.isMoving === false) {
       	       		setStepperSpeed(stepperA, data.speedA, function () { })
        	    }
        	    if (stepperB.isMoving === false) {
       	        	setStepperSpeed(stepperB, data.speedB, function () { })		
        	    }

			} else {
        	    if (stepperA.isMoving === false) {
        	        moveStepperTo(stepperA, Math.round(data.a), function () { })
        	    }
        	    if (stepperB.isMoving === false) {
        	        moveStepperTo(stepperB, Math.round(data.b), function () { })
        	    }
			}
        });
    });
    var ms1 = new five.Pin(13);
    var ms2 = new five.Pin(12);
    setMicrostep("full", ms1, ms2);

    // Steppers
    stepperA = new five.Stepper({
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

    stepperB = new five.Stepper({
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
