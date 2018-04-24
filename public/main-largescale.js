var c, c2;
var phi = 0;
var phi_2 = 0;

// We can "run the graph through x = 0" by incrementing phi. To avoid variable overflow, set phi -> 0 when phi === 100f (100 being arbitrary)

var config = {
    chartLength: 100,
    chartIncrement: 1,
    speed: 8,
    triangleHarmonics: 5,
    gridLines: 4
}

function cotan(x) { return 1 / Math.tan(x); }
var c;
var intersectCircles = function (x1, y1, r1, x2, y2, r2) {
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
    let y = controls.a * Math.sin(2 * Math.PI * controls.f * (t + _phi)) + controls.offset;
    return y;
}
var sawtoothT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    let p = 1 / c.f;
    let y = (-2 * c.a) / Math.PI * Math.atan(cotan((t * Math.PI) / (p + _phi / 2))) + c.offset;
    return y;
}
var triangleT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    let p = 1 / c.f;
    let a = c.a * .65;
    let y = a * Math.asin(Math.sin(((2 * Math.PI) / p) * (t + _phi))) + c.offset;
    return y;
}
var squareT = function (t, c) {
    let _phi = phi + (1 / .005) * c.offsetX;
    var sin = function (t) {
        return Math.sin(2 * Math.PI * c.f * (t + _phi))
    }

    let y = c.a * Math.sign(sin(t)) + c.offset;
    return y;
}

var shiftChart = function (controls) {
    phi += config.speed;
    if (phi >= 999999) {
        phi = 0;
    }
}

var controlsA = {
    a: 10,
    f: .005,
    offset: 160,
    offsetX: 0, // *f
    ft: 'sin'
}
var controlsB = {
    a: 120,
    f: .01,
    offset: 250,
    offsetX: .1, // *f
    ft: 'sin',
}

const metaControls = {
    a: {
        deltaOffsetY: .13,
        deltaOffsetX: 0.000,
        deltaA: -.0015,
        deltaF: 0
    },
    b: {
        deltaOffsetY: .13,
        deltaOffsetX: 0,
        deltaA: -.0015,
        deltaF: 0
    }
}
let points = [];

var drawResult = function (c, data) {
    // data contains length a, length b
    let A = [10, 10]
    let B = [590, 10]
    c.clearRect(0, 0, 600, 2800)
    cr.font="12px Lucida Console";
    cr.fillText('A (' + controlsA.ft + ')', 15, 25)
    cr.fillText('Δ Offset Y: ' + metaControls.a.deltaOffsetY, 15, 40)
    cr.fillText('Δ Offset X: ' + metaControls.a.deltaOffsetX, 15, 55)
    cr.fillText('Δ Frequency: ' + metaControls.a.deltaF, 15, 70)
    cr.fillText('Δ Amplitude: ' + metaControls.a.deltaA, 15, 85)
    
    cr.fillText('B (' + controlsB.ft + ')', 15, 115)
    cr.fillText('Δ Offset Y: ' + metaControls.b.deltaOffsetY, 15, 130)
    cr.fillText('Δ Offset X: ' + metaControls.b.deltaOffsetX, 15, 145)
    cr.fillText('Δ Frequency: ' + metaControls.b.deltaF, 15, 160)
    cr.fillText('Δ Amplitude: ' + metaControls.b.deltaA, 15, 175)
    
    data.a *= 1.5;
    data.b *= 1.5;
    c.strokeStyle = "rgba(0,0,0,1)";
    c.lineWidth = .8;
    // c.fillRect(A[0], A[1], 10, 10);
    // c.beginPath();
    // c.arc(A[0], A[0], data.a, 0, 2 * Math.PI, false);
    // c.stroke();

    // c.fillRect(B[0], B[1], 10, 10);
    // c.beginPath();
    // c.arc(B[0], B[1], data.b, 0, 2 * Math.PI, false);
    // c.stroke();
    let inters = intersectCircles(A[0], A[1], data.a, B[0], B[1], data.b);
    let intersection = inters[1];
    if (intersection) {
        c.beginPath();
        c.moveTo(A[0], A[1]);
        c.lineTo(intersection[0], intersection[1]);
        c.lineTo(B[0], B[1])
        c.stroke()
        points.push([intersection[0], intersection[1]])
    }
    c.lineWidth = 1;
    if (points[0]) {
        if (points.length > 5000) {
            points.shift();
        }
        c.beginPath();
        c.moveTo(points[0][0], points[0][1]);
        for (let i = 0; i < points.length; i += 1) {
            c.lineTo(points[i][0], points[i][1])
        }
        c.stroke();
    }
}

var drawChart = function (c, controls) {
    let size = 100;
    c.clearRect(0, 0, size, size)
    // Draw grid
    c.strokeStyle = 'cornflowerblue'
    c.lineWidth = 1
    for (let i = 0; i < config.gridLines; i++) {
        c.beginPath()
        c.moveTo(0, size / config.gridLines * i)
        c.lineTo(size, size / config.gridLines * i)
        c.stroke();

        c.beginPath()
        c.moveTo(size / config.gridLines * i, 0)
        c.lineTo(size / config.gridLines * i, size)
        c.stroke();
    }

    c.strokeStyle = 'black'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(0, chooseFunction(0, controls))
    for (let t = 0; t < config.chartLength * 10; t += config.chartIncrement) {
        let y = (chooseFunction(t, controls) / 10) + controls.offset;
        c.lineTo(t / 10, y, 2, 2)
    }
    c.stroke();

}
function step(timestamp) {
    shiftChart(controlsA)
    drawChart(c, controlsA);
    drawChart(c2, controlsB);
    drawResult(cr, { a: chooseFunction(10, controlsA), b: chooseFunction(10, controlsB) });
    
    controlsA.offset += metaControls.a.deltaOffsetY;
    controlsA.offsetX += metaControls.a.deltaOffsetX;
    controlsA.a += metaControls.a.deltaA;
    controlsA.f += metaControls.a.deltaF;

    controlsB.offset += metaControls.b.deltaOffsetY;
    controlsB.offsetX += metaControls.b.deltaOffsetX;
    controlsB.a += metaControls.b.deltaA;
    controlsB.f += metaControls.b.deltaF;
    window.requestAnimationFrame(step);
}


var init = function () {
    let canvas = document.querySelector('#world')
    let canvas2 = document.querySelector('#world2')
    let canvasResult = document.querySelector('#result')
    c = canvas.getContext('2d');
    c2 = canvas2.getContext('2d');
    cr = canvasResult.getContext('2d');
    let w = 600;
    let h = 2000;
    
    canvasResult.width = w * 1;
    canvasResult.height = h * 1;
    canvasResult.style.width = w+ 'px';
    canvasResult.style.height = h + 'px';

    drawChart(c, controlsA);
    drawChart(c2, controlsB);

    window.requestAnimationFrame(step);
}

init();
