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
var five = require("johnny-five"),
    board, potentiometer;

board = new five.Board();


var config = {
    maxRPM: 120,
    stepperDistance: 100,
    stepperResolution: 200, // Full steps per revolution
    wheelRadius: 12 //Stepper wheel radius in mm
}

/**
 * Converts a length in mm to a number of steps, given the radius of the output wheels and the microstepping resolution
 * @param {Float} length - Length in mm
 * @returns {number} Number of steps
 */
let lengthToSteps = function (length) {
    let c = 2 * Math.PI * Math.pow(config.wheelRadius, 2);
    let steps = length / (c / (stepperResolution * microstepResolution))
    return steps;
}

/**
 * Moves the pen to given X/Y coordinates. Waits for both steppers to stop moving before executing the callback.
 * @param {Object} point
 * @param {point.x} - X Coordinate
 * @param {point.y} - Y Coordinate
 * @param {function} callback - Called once the target position is reached
 * @example
 * moveToCoordinates({123,456});
 * @todo Add callback response
 */
let moveToCoordinates = function (point, callback) {
    let targetLength = pointToWireLength(point)
    let currentLength = [0, 0] // this needs to be read from steppers
    let deltaLengths = [targetLength[0] - currentLength[0], targetLength[1] - currentLength[1]]

    let deltaSteps = [lengthToSteps(deltaSteps[0]), lengthToSteps(deltaSteps[1])];

    //wait for both these callbacks before moving on
    var remainingSteppers = 2;
    for (let i = 0; i < 2; i++) {
        if (i === 0) {
            moveStepper(stepperA, deltaSteps[0], function () {
                remainingSteppers--;
                if (remainingSteppers === 0) {
                    plotter.position_mm.x += deltaX;
                    plotter.position_mm.y += deltaY;
                    cb();
                }
            });
        } else if (i === 1) {
            moveStepper(stepperB, deltaSteps[1], function () {
                remainingSteppers--;
                if (remainingSteppers === 0) {
                    plotter.position_mm.x += deltaX;
                    plotter.position_mm.y += deltaY;
                    cb();
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
let moveStepper = function (stepper, steps, cb) {
    stepper.isMoving = true;
    let direction = null;
    let speed = config.maxRPM;

    console.log('Moving by ' + steps + ' steps');
    stepper.rpm(speed).direction(direction).step(Math.abs(delta * 5), function () {
        stepper.currentPosition += delta;
        stepper.isMoving = false;
        io.emit('stepper ' + stepper.max_name + ' status', stepper.currentPosition)
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

let pointToWireLength = function (point) {
    let lengths = {}
    lengths.a = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2))
    lengths.b = Math.sqrt(Math.pow(config.stepperDistance - point.x, 2) + Math.pow(point.y, 2))
    return lengths;
}

/**
 * Executes a drawing
 * @param {array} instructions - Array of two-dimensional coordinates
 */
let run = function (instructions) {
    let inst = instructions[currentInst];
    moveToCoordinates(inst[0], inst[1], function () {
        if (instructions[currentInst + 1]) {
            currentInst++;
            bar1.increment();
            setTimeout(run, 20); //wait to reduce vibration
        } else {
            bar1.stop();
            console.log('Done.')
        }
    });
};

board.on("ready", function () {
    let instructions = []
    let currentInst = 0;
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
