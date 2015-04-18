var c; //context
var w, h; //document width & height
var d = {x:0, y:0};


//Images
var bgImg;
var planeImg = document.getElementById("plane");

var bubbles = {big: [], small: []};
var bubble = function(x, y, N, size) {
	this.x = x;
	this.y = y;
	this.N = N;
	this.size = size;
};

var fullhp = 100;
var plane = [];
var planeObj = function(x, y, ah) {
	this.x = x;
	this.y = y;
	this.ah = ah;
	this.shoot = false;
	this.toX = 0;
	this.toY = 0;
	this.hp = fullhp;
	this.p = 0;
	this.lastUpdate = Date.now();
	this.color = "#000000";
};

var overheat = 0;
var bulletPower = 10;
var bullet = [];
var bulletObj = function(x, y, a, v, id) {
	this.x = x;
	this.y = y;
	this.a = a;
	this.v = v;
	this.id = id;
};

var puff = [];
var puffObj = function(x, y, darkness) {
	this.x = x;
	this.y = y;
	this.size = 10;
	this.darkness = darkness;
	this.opacity = 1;
	this.explosion = false;
};

var sparkle = [];
var sparkleObj = function(x, y, size) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.a = Math.random()*(Math.PI*2);
	this.v = 2+Math.random()*20;
	this.live = 5;
};

var idList = [];

var move = 0;

var mouse = {x:100, y:100, click: {x:0, y:0}, down: false };


//Socket and networking
var myid = undefined;
var socket = io.connect("http://"+window.location.host);

var newClientJoined = false;
var randomname = [
	"Iceman", "Batman", "Fox", "Snake", "Eagle", "Mask", "Lynx", "Jedi", "Papa", "Mama", "Gator",
	"N22", "Red", "Blue", "X-ray", "Hugo", "Turtle", "Rat", "Mouse", "Light", "Flash"
];
//Send id request to server
socket.emit("id", randomname[Math.round(randomname.length*Math.random() )] );

//Server sends your id
socket.on("idown", function(data) {
	myid = data;
	newClient(data);
});

//New client joined with id
socket.on("id", function(data) {
	newClient(data);
});

//Someone changed their id
socket.on("newid", function(data) {
	if(data[0] == myid) myid = data[1];
	newClient(data[1]);
	plane[data[1] ] = plane[data[0] ];
	console.log(data[1]+"..."+myid);

	document.getElementById("players").removeChild( document.getElementById("player-"+data[0]) );
	plane.splice(data[0], 1);
	idList.splice(idList.indexOf(data[0]), 1);
});

//Receive messages
socket.on("msg", function(data) {
	document.getElementById("messages").innerHTML += "<br>"+data;
});

//Receive other plane's datas
socket.on("c", function(data) {
	if(!plane[data.id]) {
		newClient(data.id);
	}

	if(data.x) plane[data.id].x = data.x;
	if(data.y) plane[data.id].y = data.y;
	if(data.ah) plane[data.id].ah = data.ah;
	if(data.hp) plane[data.id].hp = data.hp;
	if(data.shoot) plane[data.id].shoot = data.shoot;
		else plane[data.id].shoot = false;

	if(data.color || newClientJoined) plane[data.id].color = data.color;

	shoot(data.id);

	plane[data.id].lastUpdate = Date.now();
});

//Receive explosion
socket.on("explode", function(data) {
	explode(data.x, data.y);
	info(data.killer+" shot down "+data.killed);

	//Give some points to killer.
	plane[data.killer].p += 20;
	document.querySelector("#player-"+data.killer+" .points").innerHTML = plane[data.killer].p;
});

//Send own plane's data
var last_x = 0;
var last_y = 0;
var last_ah = 0;
var last_hp = 0;
var last_color = 0;
function emit() {
	if(myid != undefined) {
		var data = {};
		data.id = myid;

		if(Math.abs(last_x-plane[myid].x) > 0.5) {
			data.x = Math.round(plane[myid].x*10)/10;
			last_x = data.x;
		}
		if(Math.abs(last_y-plane[myid].y) > 0.5) {
			data.y = Math.round(plane[myid].y*10)/10;
			last_y = data.y;
		}
		if(Math.abs(last_ah-plane[myid].ah) > 0.01) {
			data.ah = Math.round(plane[myid].ah*100)/100;
			last_ah = data.ah;
		}
		if(last_hp != plane[myid].hp) data.hp = plane[myid].hp;
		if(plane[myid].shoot) data.shoot = plane[myid].shoot;

		if(last_color != plane[myid].color) data.color = plane[myid].color;

		socket.emit("c", data );
	}
}



//Add new client
function newClient(id) {
	idList.push(id);
	plane[id] = new planeObj(0,0,0);

	document.getElementById("players").innerHTML += "<div class='player' id='player-"+id+
		"'><span class='name'>"+id+"</span><br><span class='points'>0</span></div>";

	newClientJoined = true;
}
//Remove client
function checkClients() {
	for(var i=0; i<idList.length; i++) {
		//If client have not updatet themself over 5s, remove it
		if(Date.now()-plane[idList[i] ].lastUpdate > 5000 && idList[i]!=myid) {			
			document.getElementById("players").removeChild( document.getElementById("player-"+idList[i]) );

			plane.splice(idList[i], 1);
			idList.splice(i, 1);
		}
	}

	setTimeout(checkClients, 5000);
}

//Send local info messages
function info(msg) {
	document.getElementById("messages").innerHTML += "<br><i>"+msg+"</i>";
}



init();
function init() {
	//Init basic vars
	w = document.body.clientWidth;
	h = document.body.clientHeight;

	bgImg = document.createElement("canvas").getContext("2d");
	bgImg.canvas.width = w;
	bgImg.canvas.height = h;
	bgImg.fillStyle = "#72A3DB";
	bgImg.fillRect(0,0,w,h);
	bgImg.fill();

	var lastC = 140+Math.round(Math.random()*110);
	for(var x=0; x<w; x+=5) {
		for(var y=0; y<h; y+=5) {
			bgImg.fillStyle = "rgb(34,34,"+(Math.round(lastC-20+Math.random()*40))+")";
			bgImg.fillRect(x, y, 5, 5);
		}
	}
	bgImg.fill();

	bgImg = bgImg.canvas;

	//Init canvas
	c = document.getElementById("canvas").getContext("2d");
	c.canvas.width = w;
	c.canvas.height = h;
	c.clearRect(0,0,w,h);


	//Make bubbles
	for(var i=0; i<50; i++) {
		var size = Math.random()*5;
		var s = "small";
		if(size > 3)
			s = "big";

		bubbles[s].push(
			new bubble(
				Math.random()*w, Math.random()*h,
				Math.random()*3, size
			)
		);
	}

	//Focus on chat input
	document.getElementById("msginput").focus();

	//Start loop
	loop();
	checkClients();
}

function loop() {

	logic();
	draw();

	emit();

	requestAnimationFrame(loop);
}

function logic() {
	if(myid != undefined)
		planeLogic(myid, mouse.x, mouse.y);
}

function draw() {
	//c.translate(d.x, d.y);
	c.drawImage(bgImg, 0, 0);

	c.beginPath();
	drawBullet();

	c.beginPath();
	drawPuff();
	c.closePath();

	c.beginPath();
	drawSparkle();

	c.beginPath();
	for(var i=0; i<idList.length; i++) {
		drawPlane(idList[i]);
	}


}

//MOUSE
//AND
//TOUCH
//EVENTS

document.addEventListener('touchmove', function(e) {
	e.preventDefault();
	mouse.x = e.touches[0].pageX;
	mouse.y = e.touches[0].pageY;

	if(plane[myid])
		plane[myid].shoot = true;

}, false);

document.onmousemove = function(e) {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
};

document.onmousedown = function(e) {
	e.preventDefault();

	if(plane[myid])
		plane[myid].shoot = true;
};

document.onmouseup = function(e) {
	if(plane[myid])
		plane[myid].shoot = false;
};

//
//
//
//


function drawBullet() {
	c.fillStyle = "#fff";

	for(var i=0; i<bullet.length; i++) {
		c.fillRect(bullet[i].x-2, bullet[i].y-2, 4, 4);

		bullet[i].x -= Math.cos(bullet[i].a)*bullet[i].v;
		bullet[i].y -= Math.sin(bullet[i].a)*bullet[i].v;
		if(bullet[i].x > w || bullet[i].x < 0 || bullet[i].y < 0 || bullet[i].y > h) {
			bullet.splice(i, 1);
			continue;
		}

		//Bullet collision check to plane
		for(var p=0; p<idList.length; p++) {
			if(!plane[idList[p] ] || !bullet[i]) continue;
			X = bullet[i].x - plane[idList[p] ].x;
			Y = bullet[i].y - plane[idList[p] ].y;
			W = 4 + 15;

			//Bullet hits
			if(X*X + Y*Y <= W*W) {
				//If bullet hits you
				if(idList[p] == myid) {
					plane[idList[p] ].hp -= bulletPower;
				}

				//Make sparkles
				sparkle.push( new sparkleObj(plane[idList[p] ].x, plane[idList[p] ].y, 2) );

				//If bullet kills player
				if(plane[idList[p] ].hp < bulletPower) {				
					//Explode plane and tell about it to whole world
					if(idList[p] == myid) {
						explode(plane[idList[p] ].x, plane[idList[p] ].y);
						info(bullet[i].id+" shot down <b>you</b>");
						//Send explode message to the world
						socket.emit("explode", {x:plane[idList[p] ].x, y:plane[idList[p] ].y, killer:bullet[i].id, killed:idList[p]});
						plane[idList[p] ].hp = fullhp;
						plane[idList[p] ].x = Math.random()*w;
						plane[idList[p] ].y = h+40;

						//Give some points to killer.
						plane[bullet[i].id].p += 20;
						document.querySelector("#player-"+bullet[i].id+" .points").innerHTML = plane[bullet[i].id ].p;
					}
				}

				//Finally delete that bullet
				bullet.splice(i, 1);
			}
		}


	}
	c.fill();
}

//Planelogic controls own plane logic
var lastShooted = 0;
var capa = null;
function planeLogic(id, toX, toY) {

//Calculate angle towards cursor
	var angle = Math.PI/2+Math.atan2( (toX-plane[id].x),(toY-plane[id].y) );

//Set move power
	move = Math.sqrt( Math.pow(toX-plane[id].x,2)+Math.pow(toY-plane[id].y,2) );
	if(move < 60) {
		move = 1;
		if(capa == null) capa = angle +Math.PI*0.5;
		capa -= 0.02;
		angle = capa;
	}
	else {
		move = 1+move*0.002;
		capa = null;
	}

//Move own planeObj
	//Rotate
	plane[id].ah = -angle;
	//Move
	plane[id].x -= Math.cos(plane[id].ah)*move;
	plane[id].y -= Math.sin(plane[id].ah)*move;

	if(overheat >= 0 && overheat <= 100 ) {
		if(plane[id].shoot) overheat++;
		else overheat -= 0.2;
		shoot(id);
	}
	if(overheat > 100) {
		overheat = -400;
		info("Cannon overheated");
	}

	if(overheat < 0) overheat++;
}

function shoot(id) {
	//Shooting
	if(plane[id].shoot && Date.now() > lastShooted+100 ) {
		bullet.push( new bulletObj(plane[id].x, plane[id].y, plane[id].ah-0.1+Math.random()*0.2, 30, id) );
		lastShooted = Date.now();
	}
}

var propel = 0;
function drawPlane(id) {
/*
	c.save();
	c.translate(x, y);
	c.rotate(plane[id].ah);
	c.transform(0.2,0,0,0.2,0,0); //Scale
	if(plane[id].ah < -Math.PI/2)
		c.transform(1,0,0,-1,0,0);

	c.drawImage(planeImg, 0, -planeImg.height/2);

	c.beginPath();
	c.strokeStyle = "black";
	c.lineWidth = 10;
	c.moveTo(10, (-planeImg.height/3)*propel );
	c.lineTo(10, (planeImg.height/2)*propel );
	c.closePath();
	c.stroke();

	c.restore();
	*/
	c.save();
	c.translate(plane[id].x, plane[id].y);
	c.rotate(plane[id].ah);
	c.strokeStyle = plane[id].color;

	c.shadowColor = "#000000";
	c.shadowBlur    = 9;
	c.shadowOffsetX = -10;
	c.shadowOffsetY = 32;  

	//Plane
	c.beginPath();
	c.lineWidth = 5;
	c.moveTo(5, -15);
	c.lineTo(5, 15);
	c.closePath();
	c.stroke();

	c.beginPath();
	c.lineWidth = 5;
	c.moveTo(0, 0);
	c.lineTo(25, 0);
	c.closePath();
	c.stroke();

	//Propel
	c.beginPath();
	c.lineWidth = 5;
	c.moveTo(0, -10*propel );
	c.lineTo(0, 10*propel );
	c.closePath();
	c.stroke();

	c.restore();

	propel += 0.2;
	if(propel > 1)
		propel = 0;

	//Make possible puff
	if(Math.random() > 0.89+(plane[id].hp/1000) ) {
		puff.push( new puffObj(
			plane[id].x+15*Math.cos(plane[id].ah),
			plane[id].y+15*Math.sin(plane[id].ah), 1-plane[id].hp/100
			)
		);
	}

}

function explode(x, y) {
	for(var i=0; i<20; i++) {
		puff.push( new puffObj(x-20+Math.random()*40, y-20+Math.random()*40, Math.random() ) );
		puff[puff.length-1].explosion = true;
	}
}

function drawPuff() {
	for(var i=0; i<puff.length; i++) {
		if(puff[i].darkness <= 0) puff[i].darkness = 0;
		if(puff[i].darkness >= 1) puff[i].darkness = 1;

		var d = Math.round( 255*(1-puff[i].darkness) );
		c.beginPath();
		if(puff[i].explosion) c.fillStyle = "rgba("+d+",0,0,"+puff[i].opacity+")";
		else c.fillStyle = "rgba("+d+","+d+","+d+","+puff[i].opacity+")";
		c.rect(puff[i].x-puff[i].size/2, puff[i].y-puff[i].size/2, puff[i].size, puff[i].size);
		c.fill();
		c.closePath();

		puff[i].size += 0.1;
		puff[i].opacity -= 0.02;
		if(puff[i].opacity < 0) puff.splice(i, 1);
	}
}

function drawSparkle() {
	for(var i=0; i<sparkle.length; i++) {
		c.strokeStyle = "#000000";
		c.lineWidth = sparkle[i].size;

		c.moveTo(sparkle[i].x, sparkle[i].y);
		c.lineTo(sparkle[i].x+Math.random()*10, sparkle[i].y+Math.random()*10);
		c.stroke();

		sparkle[i].x += Math.cos(sparkle[i].a)*sparkle[i].v;
		sparkle[i].y += Math.sin(sparkle[i].a)*sparkle[i].v;
		sparkle[i].live--;
		if(sparkle[i].live < 0) sparkle.splice(i, 1);
	}
}
/*
function drawplaneObj(x, y) {


	//Head
	c.save();
	c.translate(x, y);
	c.rotate(plane[0].ah);

	c.beginPath();
	c.moveTo(0, 0);
	c.bezierCurveTo(0, -10, 60, -20, 60, 0);
	c.bezierCurveTo(60, +20, 0, +10, 0, 0);
	c.closePath();

	c.fill();
	c.stroke();
	c.restore();

	//Tail
	c.save();
	c.translate(x, y);
	c.rotate(plane[0].at);

	c.beginPath();
	c.moveTo(0, 0);
	c.bezierCurveTo(0, -5, -30, -5, -30, 0);
	c.bezierCurveTo(-30, +5, 0, +5, 0, 0);
	c.closePath();

	c.fill();
	c.stroke();
	c.restore();

}
*/

function drawBubbles(s) {
	c.strokeStyle = "#ededde";

	for(var i=0; i<bubbles[s].length; i++) {
		c.beginPath();
		c.arc(bubbles[s][i].x, bubbles[s][i].y, bubbles[s][i].size, 0, Math.PI*2);
		c.closePath();
		c.stroke();

		bubbles[s][i].y -= bubbles[s][i].size;
		if(bubbles[s][i].y < 0) {
			bubbles[s][i].x = Math.random()*w;
			bubbles[s][i].y = h;
		}
	}

}
