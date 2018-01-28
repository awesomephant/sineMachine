var c;
var phi = 0;

// We can "run the graph through x = 0" by incrementing phi. To avoid variable overflow, set phi -> 0 when phi === 100f (100 being arbitrary)

var config = {
    chartLength: 600,
    chartIncrement: .01,
    speed: .1,
    triangleHarmonics: 5,
    gridLines: 8
}

var sinT = function (t) {
    let y = controls.a * Math.sin(2 * Math.PI * controls.f * t + phi) + controls.offset;
    return y;
}
var triangleT = function (t) {
    let p = 1 / f;
    let y = a * Math.asin(Math.sin(((2 * Math.PI) / p) * t + phi)) + offset;
    return y;
}
var squareT = function (t) {
    var sin = function (t) {
        return Math.sin(2 * Math.PI * f * t + phi)
    }

    let y = a * Math.sign(sin(t)) + offset;
    return y;
}

var init = function (cb) {
    let canvas = document.querySelector('#world')
    c = canvas.getContext('2d');
    cb();
}

var shiftChart = function () {
    phi += config.speed;
    if (phi >= 1 / controls.f) {
        phi = 0;
    }
    console.log(phi)
}

var drawChart = function () {
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
    c.moveTo(0, sinT(0))
    for (let t = 0; t < config.chartLength; t += config.chartIncrement) {
        let y = sinT(t);
        c.lineTo(t, y, 2, 2)
    }
    c.stroke();
}

function step(timestamp) {
    shiftChart()
    drawChart();
    window.requestAnimationFrame(step);
}


init(function () {
    drawChart();
    window.requestAnimationFrame(step);
})