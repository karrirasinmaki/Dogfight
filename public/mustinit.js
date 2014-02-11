var socket;

function typing() {
	document.getElementById("msgbox").innerHTML = document.forms["chat"]["msg"].value;
}
//Send message
function sendMessage() {
	var msg = document.forms["chat"]["msg"].value;
	document.forms["chat"]["msg"].value = "";

	//If user wants to change their name
	if(msg.substring(0, 5) == "name:") {
		socket.emit("newid", [myid, msg.substring(5)] );
	}
	//If user wants to change their color
	else if(msg.substring(0, 6) == "color:") {
		plane[myid].color = msg.substring(6);
		info("you are now <b style='color:"+msg.substring(6)+";'>"+msg.substring(6)+"</b>" );
	}
	else socket.emit("msg", msg+" -"+myid);
}