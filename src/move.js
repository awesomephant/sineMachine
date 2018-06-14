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

var stepperA, stepperB;

var five = require("johnny-five"),
    board, potentiometer;

board = new five.Board();

var config = {
    maxRPM: 50,
    scale: 10,
    stepperResolution: 200, // Full steps per revolution
    microstepResolution: 1,
    wheelDiameter: 3 //Stepper wheel radius in mm
}



/**
 * Moves a stepper by a given number of steps. Use {@link lengthToSteps} to convert mm to steps.
 * @argument{Stepper} Stepper to move.
 * @param {number} steps - Steps to move (positive or negative).
 * @param {function} callback - Called when the move is complete.
 */
const moveStepper = function (stepper, steps, cb) {
    stepper.isMoving = true;
    steps = Math.round(steps);
    let direction = null;
    let speed = config.maxRPM;
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

    moveStepper(stepperA, 10, function(){})
    moveStepper(stepperB, -10, function(){})
});
