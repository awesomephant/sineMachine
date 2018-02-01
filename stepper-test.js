var five = require("johnny-five"),
    board, potentiometer;

var board = new five.Board();

var config = {
    maxRPM: 150
}

var moveStepperTo = function (stepper, n, cb) {
    let delta = 0;
    let direction = null;
    delta = n - stepper.currentPosition;
    if (delta > 0) {
        direction = 1;
    } else {
        direction = 0;
    }
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

    stepperA.currentPosition = 0;

    moveStepperTo(stepperA, -2000, function () {
        console.log('done')
    })
});