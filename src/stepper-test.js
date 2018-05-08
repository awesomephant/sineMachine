var five = require("johnny-five"),
    board, potentiometer;

var board = new five.Board();

var config = {
    maxRPM: 250
}
var setMicrostep = function (resolution, ms1, ms2) {
    if (resolution === "half") {
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
var moveStepperTo = function (stepper, n, cb) {
    let delta = 0;
    let direction = null;
    delta = n - stepper.currentPosition;
    if (delta > 0) {
        direction = 1;
    } else {
        direction = 0;
    }
    let speed = config.maxRPM / (20 / Math.abs(delta));
    console.log('Moving by ' + delta + ' steps');
    console.log('Direction: ' + direction);
    stepper.rpm(config.maxRPM).direction(direction).step(Math.abs(delta), function () {
        stepper.currentPosition += delta;
        cb();
    });
}

board.on("ready", function () {
    var k = 0;
    var stepperA = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 200,
        pins: {
            step: 10,
            dir: 11
        }
    });
    var stepperB = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 200,
        pins: {
            step: 8,
            dir: 9
        }
    });

    stepperB.currentPosition = 0;

    var ms1 = new five.Pin(13);
    var ms2 = new five.Pin(12);
    setMicrostep("quarter", ms1, ms2);


    stepperA.currentPosition = 0;

    moveStepperTo(stepperA, -2000, function () {
        console.log('done')
        moveStepperTo(stepperA, 0, function () {
            console.log('done')
        })
    })
    moveStepperTo(stepperB, -2000, function () {
        console.log('done')
        moveStepperTo(stepperB, 0, function () {
            console.log('done')
        })
    })
});