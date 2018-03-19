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

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/largescale.html');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});