'use strict';

var UTILS = require('./utils.js');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const server = http.createServer();
const wsServer = new WebSocket.Server( // represents websocket server
    { noServer: true } // issue manual upgrade
); 

// env variable
const WEB_SRV_HOST = process.env.WEB_SRV_HOST ? process.env.WEB_SRV_HOST : 'localhost';  // interface to bind to (could be only one)
const WEB_SRV_PORT = process.env.WEB_SRV_PORT ? process.env.WEB_SRV_PORT : 8080;  // port on bind interface
const HEARTBEAT_INT_MS = process.env.HEARTBEAT_INT_MS ? process.env.HEARTBEAT_INT_MS : 30000;  // interval in which we check client if its still connected
const LOG_PAYLOAD = process.env.LOG_PAYLOAD ? process.env.LOG_PAYLOAD : false;  // data exchange verbose logging
const LOG_LIFECYCLE = process.env.LOG_LIFECYCLE ? process.env.LOG_LIFECYCLE : true;  // lifecyle events (connect, reconnect, pingpong)

// setup logging library
UTILS.Logging.EnablePayloadLogging = LOG_PAYLOAD;
UTILS.Logging.EnableLifecycleLogging = LOG_LIFECYCLE;

function noop() {}

/** dummy authentication */
function authenticate(request, cbAuthenticated) {
    if (request.headers['sec-websocket-protocol'] !== 'ocpp1.6'){
        cbAuthenticated("Connection denied");
    }else {
        cbAuthenticated();
    }
}

wsServer.on('connection', function connection(webSocket, req) {

    // websocket represent client websocket; ie socket connected to client. connection is bidirectional
    
    var statInt;
    
    UTILS.Fn.lifecyc(`Connected from: ${req.url}`);

    // define manual propety on webSocket object to track liveliness
    webSocket.isAlive = true;
    
    webSocket.on('pong', function(){ // register handler, when client respons with PONG

        UTILS.Fn.log(`Received heartbeat PONG`);

        this.isAlive = true;
    }); 

    webSocket.on('message', function incoming(message) { // recive msg from client
        debugger;

        UTILS.Fn.data('Received: ', message);
        
        let ocppMsg;
        try {
            ocppMsg = JSON.parse(message);
        } catch(e) {
            UTILS.Fn.err("Error parsing incoming json message");
            return false;
        }

        let msgNum = parseInt(ocppMsg[1], 16), msgType = ocppMsg[2];

        let d = new Date(); 
        var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);

        // respond back to heartbeat message
        if (msgType.toLowerCase() === "Heartbeat".toLowerCase()){  
            
            // send back ocpp heartbeat response. You just send back time
            webSocket.send(
                JSON.stringify([UTILS.OcppCallType.ServerToClient, ocppMsg[1], { "currentTime": datestring } ])
            ); 

        }else if (msgType.toLowerCase() === "BootNotification".toLowerCase()){

            // confirm bo0t notification - send back ocpp boot notification response
            webSocket.send(
                JSON.stringify([UTILS.OcppCallType.ServerToClient, ocppMsg[1], { "status": "Accepted", "currentTime": datestring, "interval": 300 }  ])
            ); 
        }
        else{
            UTILS.Fn.warn(`Skiping message type: ${msgType}`);
        }

    });

    webSocket.on('close', function close() {
        UTILS.Fn.lifecyc('client connection closed'); 
    });

});

wsServer.on('close', function close() {
    console.log("Shuting down websocket server");
    clearInterval(intervalHeartbeat);
});

server.on('upgrade', function upgrade(request, socket, head) {
    debugger;
    
    let pathname = url.parse(request.url).pathname;
    let chargepointId = stripTrailingSlash(pathname);

    authenticate(request, (err) => {
        if (err) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        UTILS.Fn.lifecyc(`Upgrading request for chargepoint ${chargepointId}`);
        
        wsServer.handleUpgrade(request, socket, head, function done(webSocket) {
            wsServer.emit('connection', webSocket, request);
        });
    });

    
});

function logClient(client){
    var sb = ["Connected client "];
    sb.push(client._socket.remoteAddress);
    sb.push(":");
    sb.push(client._socket.remotePort);
    return sb.join("");
}

function stripTrailingSlash(str) {
    if(str.startsWith("/")) {
        return str.substr(1, str.length - 1);
    }
    return str;
}

// purpose of this interval is to reset isAlive for all cients
const intervalHeartbeat = setInterval(function ping() {
    if (wsServer.clients.length === 0) return;
    
    // notvery sufficient, but only way - iteration through internal structure
    wsServer.clients.forEach(function each(wsClient) {
        if (wsClient.isAlive === false){ // not reachable any more
            UTILS.Fn.lifecyc("Terminating nonreachable client");
            return wsClient.terminate();
        }

        UTILS.Fn.lifecyc("Trigering ping to client: " + logClient(wsClient));
        wsClient.isAlive = false; // set to false, heartbeat handler will set it to true
        wsClient.ping(noop); // trigger event   
    });

}, HEARTBEAT_INT_MS);

// start http server
server.listen(WEB_SRV_PORT, WEB_SRV_HOST, () => {
    console.log(`Server is running on http://${WEB_SRV_HOST}:${WEB_SRV_PORT}`);
});