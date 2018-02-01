var c, c2;
var phi = 0;
var phi_2 = 0;

// We can "run the graph through x = 0" by incrementing phi. To avoid variable overflow, set phi -> 0 when phi === 100f (100 being arbitrary)

var config = {
    chartLength: 600,
    chartIncrement: 1,
    speed: .005,
    triangleHarmonics: 5,
    gridLines: 8
}

var stepperStatus = {
    a: 0
}

function cotan(x) { return 1 / Math.tan(x); }

var chooseFunction = function (t, controls) {
    if (controls.ft === 'sin') {
        return sinT(t, controls)
    } else if (controls.ft === 'triangle') {
        return triangleT(t, controls)
    } else if (controls.ft === 'square') {
        return squareT(t, controls)
    } else if (controls.ft === 'sawtooth') {
        return sawtoothT(t, controls)
    }
}

var sinT = function (t, controls) {
    let _phi = phi + (1 / .005) * controls.offsetX;
    let y = controls.a * Math.sin(2 * Math.PI * controls.f * t + _phi) + controls.offset;
    return y;
}
var sawtoothT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    let p = 1 / c.f;
    let y = (-2 * c.a) / Math.PI * Math.atan(cotan((t * Math.PI) / p + _phi / 2)) + c.offset;
    return y;
}
var triangleT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    let p = 1 / c.f;
    let a = c.a * .65;
    let y = a * Math.asin(Math.sin(((2 * Math.PI) / p) * t + _phi)) + c.offset;
    return y;
}
var squareT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    var sin = function (t) {
        return Math.sin(2 * Math.PI * c.f * t + _phi)
    }

    let y = c.a * Math.sign(sin(t)) + c.offset;
    return y;
}

var init = function (cb) {
    let canvas = document.querySelector('#world')
    let canvas2 = document.querySelector('#world2')
    c = canvas.getContext('2d');
    c2 = canvas2.getContext('2d');
    cb();
}

var shiftChart = function (controls) {
    phi += config.speed;
    if (phi >= 2 * Math.PI * (1 / controls.f)) {
        console.log(phi)
        phi = 0;
    }
}

var controlsA = {
    a: 700,
    f: .005,
    offset: 300,
    offsetX: 0, // *f
    ft: sinT
}
var controlsB = {
    a: 70,
    f: .005,
    offset: 300,
    offsetX: 1, // *f
    ft: sawtoothT,
    id: 'b'
}

var drawChart = function (c, controls) {
    c.clearRect(0, 0, 600, 600)
    // Draw grid
    c.strokeStyle = 'pink'
    c.lineWidth = 1
    for (let i = 0; i < config.gridLines; i++) {
        c.beginPath()
        c.moveTo(0, 600 / config.gridLines * i)
        c.lineTo(600, 600 / config.gridLines * i)
        c.stroke();

        c.beginPath()
        c.moveTo(600 / config.gridLines * i, 0)
        c.lineTo(600 / config.gridLines * i, 600)
        c.stroke();
    }

    c.strokeStyle = 'white'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(0, chooseFunction(0, controls))
    for (let t = 0; t < config.chartLength; t += config.chartIncrement) {
        let y = chooseFunction(t, controls);
        c.lineTo(t, y, 2, 2)
    }
    c.stroke();
    c.fillStyle = 'red';
    c.fillRect(0, stepperStatus.a, 10,10)
    c.fillStyle = 'yellow';
    c.fillRect(0, stepperStatus.b, 10,10)

}

var sendUpdate = function(){
    let data = {
        a: chooseFunction(0, controlsA),
        b: chooseFunction(0, controlsB)
    }
    socket.emit('functionStep', data, (data) => {
    });
}

function step(timestamp) {
    shiftChart(controlsA)
    shiftChart(controlsB)
    drawChart(c, controlsA);
    drawChart(c2, controlsB);
    window.requestAnimationFrame(step);
}


init(function () {
    drawChart(c, controlsA);
    drawChart(c2, controlsB);

    window.setInterval(sendUpdate, 30)
    window.requestAnimationFrame(step);
})