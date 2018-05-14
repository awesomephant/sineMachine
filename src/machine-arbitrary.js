/**
 * 
 * @param {string} resolution 
 * @param {Stepper} ms1 
 * @param {Stepper} ms2 
 */
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

var _instructions = require("../instructions.json");
var currentInst = 0;
var instructions = [];
var stepperA, stepperB;

var five = require("johnny-five"),
    board, potentiometer;

board = new five.Board();


var config = {
    maxRPM: 50,
    scale: 1,
    waitTime: 200,
    stepperDistance: 2655,
    stepperResolution: 200, // Full steps per revolution
    microstepResolution: 1,
    wheelDiameter: 3, //Stepper wheel radius in mm
    origin: {
        x: 1327,
        y: 1000
    },
    offset: {
        x: 600,
        y: 600
    }
}

/**
 * Converts a length in mm to a number of steps, given the diameter of the output wheels and the microstepping resolution
 * @param {Float} length - Length in mm
 * @returns {number} Number of steps
 */
const lengthToSteps = function (length) {
    let c = 2 * Math.PI * Math.pow(config.wheelDiameter, 2);
    let steps = length / (c / (config.stepperResolution * config.microstepResolution))
    return steps;
}
const calculateRPM = function (deltaX, deltaY) {
    // calculate rel pen velocity
    let dx = Math.abs(deltaX);
    let dy = Math.abs(deltaY);
    let ratio = 1;
    let rpm = { a: config.maxRPM, b: config.maxRPM };
    if (dx > dy) {
        ratio = dy / dx;
        rpm.b = config.maxRPM * ratio;
        rpm.a = config.maxRPM;
    } else if (dy > dx) {
        ratio = dx / dy;
        rpm.a = config.maxRPM * ratio;
        rpm.b = config.maxRPM;
    }
    if (dx === 0) {
        rpm.a = 0;
        rpm.b = config.maxRPM;
    } else if (dy === 0) {
        rpm.a = config.maxRPM;
        rpm.b = 0;
    }
    console.log('RPM: A=' + rpm.a + ' B=' + rpm.b)
    return rpm;
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


/**
 * Moves the pen to given X/Y coordinates. Waits for both steppers to stop moving before executing the callback.
 * @param {Object} point
 * @param {point.x} - X Coordinate
 * @param {point.y} - Y Coordinate
 * @param {function} callback - Called once the target position is reached
 * @todo Set stepper speeds so they arrive at the same time
 */
const moveToCoordinates = function (point, callback) {
    let targetLength = pointToWireLength(point)
    let currentLength = [stepsToLength(stepperA.currentPosition), stepsToLength(stepperB.currentPosition)]
    let deltaLengths = [targetLength.a - currentLength[0], targetLength.b - currentLength[1]]
    let rpm = calculateRPM(deltaLengths[0], deltaLengths[1])

    let deltaSteps = [lengthToSteps(deltaLengths[0]), lengthToSteps(deltaLengths[1])];
    console.log('Current Length: ' + currentLength[0] + ' / ' + currentLength[1])
    console.log('Target Length: ' + targetLength.a + ' / ' + targetLength.b)
    console.log('Delta: ' + deltaLengths[0] + ' / ' + deltaLengths[1])
    //wait for both these callbacks before moving on
    var remainingSteppers = 2;
    for (let i = 0; i < 2; i++) {
        if (i === 0) {
            moveStepper(stepperA, deltaSteps[0], rpm.a, function () {
                remainingSteppers--;
                if (remainingSteppers === 0) {
                    callback();
                }
            });
        } else if (i === 1) {
            moveStepper(stepperB, deltaSteps[1], rpm.b, function () {
                remainingSteppers--;
                if (remainingSteppers === 0) {
                    callback();
                }
            });
        }

    }
}

/**
 * Moves a stepper by a given number of steps. Use {@link lengthToSteps} to convert mm to steps.
 * @argument{Stepper} Stepper to move.
 * @param {number} steps - Steps to move (positive or negative).
 * @param {function} callback - Called when the move is complete.
 */
const moveStepper = function (stepper, steps, rpm, cb) {
    stepper.isMoving = true;
    steps = Math.round(steps);
    let direction = null;
    let speed = rpm;
    if (steps < 0) {
        direction = 0
    } else {
        direction = 1;
    }
    console.log('Moving by ' + steps + ' steps');
    stepper.rpm(speed).direction(direction).step(Math.abs(steps) * config.scale, function () {
        stepper.currentPosition += steps;
        stepper.isMoving = false;
        cb();
    });
}
/**
 * Converts x/y coordinates to wire lengths
 * @param {Object} point
 * @param {point.x} - X Coordinate
 * @param {point.y} - Y Coordinate
 * @returns {object} - Object containing the lengths of both wires in coordinate units
 */

const pointToWireLength = function (point) {
    let lengths = {}
    lengths.a = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2))
    lengths.b = Math.sqrt(Math.pow(config.stepperDistance - point.x, 2) + Math.pow(point.y, 2))
    return lengths;
}

/**
 * Executes a drawing
 * @param {array} instructions - Array of two-dimensional coordinates
 */
const run = function () {
    //console.log(instructions[1])
    let inst = instructions[currentInst];
    let point = {
        x: inst[0],
        y: inst[1]
    }
    console.log(point)
    moveToCoordinates(point, function () {
        currentInst++;
        setTimeout(run, config.waitTime); //wait to reduce vibration
    });
};

board.on("ready", function () {
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
    stepperB.isMoving = false;
    stepperB.max_name = 'b'

    // Set the origin to wherever we are at the moment
    let origin = pointToWireLength(config.origin)
    stepperA.currentPosition = lengthToSteps(origin.a);
    stepperB.currentPosition = lengthToSteps(origin.b);

    for (let i = 0; i < _instructions.length; i++) {
        if (_instructions[i].length === 2) {
            // if its not a point array, remove it
            let ins = [_instructions[i][0] + config.offset.x, _instructions[i][1] +  config.offset.y]
            instructions.push(ins);
        }
    }
    instructions.push([config.origin.x, config.origin.y])


    run();
});