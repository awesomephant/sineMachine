var gri = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
var gra = function(min, max) {
    return Math.random() * (max - min) + min;
}
const express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('A user connected');
    randomizeVars();
});

var randomizeVars = function () {
    var data = {
        a: gri(10,130),
        f: gra(.001, .005),
        offset: gri(200, 500)
    }
    io.emit('update', data)
    setTimeout(randomizeVars, 2000)
}

http.listen(3000, function () {
    console.log('listening on *:3000');
});