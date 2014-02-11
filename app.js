
var app = require("express") ()
	, server = require("http").createServer(app)
	, io = require("socket.io").listen(server)
	, express = require("express");

io.configure(function () {
	io.set('transports', ['xhr-polling', 'jsonp-polling']);
});
//server.listen(8080, {origins: '*:*'});

server.listen(8080);

//Load files
app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});
app.use("/", express.static(__dirname + "/public"));


io.sockets.on("connection", function(socket) {

	socket.on("id", function(id) {
		socket.emit("idown", id);
		socket.broadcast.emit("id", id);
	});

	//Someone changed their id
	socket.on("newid", function(data) {
		socket.emit("newid", data);
		socket.broadcast.emit("newid", data);
	});

	socket.on("c", function(data) {
		socket.broadcast.emit("c", data);
	});

	socket.on("explode", function(data) {
		socket.broadcast.emit("explode", data);
	});

	socket.on("msg", function(data) {
		socket.emit("msg", data);
		socket.broadcast.emit("msg", data);
	});

});