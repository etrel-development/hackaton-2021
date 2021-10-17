'use strict';

const WebSocket = require('ws');
const CONSTANTS = require('./const.js')

// Connection settings
const OPENING_HANDSHAKE_TIMEOUT_MS = 30 * 1000; // wait time for protocol upgrade call
const AUTO_RECONNECT_INTERVAL_MS = 90 * 1000; // in case of connection lost, use this settings
const OCPP_HEARTBEAT_INTERVAL_OVERRIDE_MS = null; //  override hb interval set by CS 

// env variables 
const CS_PROTOCOL = process.env.CS_PROTOCOL ? process.env.CS_PROTOCOL : "ws"; // use wss for SSL
const CS_HOST = process.env.CS_HOST ? process.env.CS_HOST : "localhost";  // central system host
const CS_PORT = process.env.CS_PORT ? process.env.CS_PORT : 8080;  // port
const CONCURRENCY_LEVEL = process.env.CONCURRENCY_LEVEL ? process.env.CONCURRENCY_LEVEL : 2;  // one client by default

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function WebSocketClient(cId) {
    this.clientId = cId;
    this.pingTimeout = undefined;
    this.autoReconnectInterval = AUTO_RECONNECT_INTERVAL_MS; // ms
    this.ocppMessageCounter = 1; // ocpp communication contract; must increment on each message sent
    this.ocppHeartBeatIntervalMs = 0; // comes from bootNotification response
    this.ocppHeartBeatInterval = undefined; // interval object
}

WebSocketClient.prototype.open = function(url) {

    var that = this;
    debugger;
    this.url = url;
    this.instance = new WebSocket(URL, ['ocpp1.6'], {
        handshakeTimeout: OPENING_HANDSHAKE_TIMEOUT_MS,

        // If the `rejectUnauthorized` option is not `false`, the server certificate
        // is verified against a list of well-known CAs. An 'error' event is emitted
        // if verification fails.
        rejectUnauthorized: false
    });

    // NOTE: we are not using ping / pong functionality on our
    this.instance.on('ping', function() {
        //debugger;
        console.log(that.clientId + " - Received PING");
        clearTimeout(this.pingTimeout);

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.pingTimeout = setTimeout(() => {
            debugger;
            console.log(that.clientId +  " - Disconected from server");
            this.terminate();
        }, 30000 + 1000);
    });

    this.instance.on('pong', function() { // this is issued if client sends ping
        console.log("Event pong");
    });

    this.instance.on('open', function open() {
        //debugger;
        console.log(that.clientId + " - connect ok - will send BOOT notification now");
        
        let bootNotificationRequest = {
            chargeBoxIdentity: CP_ID,
            chargeBoxSerialNumber: CP_ID,
            chargePointModel: "ETREL INCH VIRTUAL Charger vOCPP16J",
            chargePointSerialNumber: CP_ID, 
            chargePointVendor: "Etrel",
            firmwareVersion: "1.0",
            iccid: "",
            imsi: "",
            meterSerialNumber: "",
            meterType: ""
        };

        let bootNotifiPayload = JSON.stringify([CONSTANTS.OcppCallType.ClientToServer, that.msgId(), "BootNotification", bootNotificationRequest]);
        console.log("Sending data to CS: " + bootNotifiPayload);

        //debugger;
        // this is websocket object  (this.instance) and not our WebSocketClient prototype!!
        this.send(bootNotifiPayload);

    });

    this.instance.on('message', function incoming(data) {
        //debugger; 
        
        console.log("Message received: ");
        console.log(data);
        
        let msgArr = JSON.parse(data);
        let t = new Date();
        
        // in boot notification we receive interval for heartbeat
        if (msgArr[0] === 3 && msgArr[2]["interval"]){  // boot notification response

            this.ocppHeartBeatIntervalMs = 
                OCPP_HEARTBEAT_INTERVAL_OVERRIDE_MS != null ?
                OCPP_HEARTBEAT_INTERVAL_OVERRIDE_MS :
                msgArr[2]["interval"] * 1000;

            console.log(that.clientId + " OCPP heartbeat interval suggested by CS: " + msgArr[2]["interval"]);
            console.log(that.clientId + " Next interval will be at: " + new Date(t.setSeconds(t.getSeconds() + this.ocppHeartBeatIntervalMs/1000)));

            this.ocppHeartBeatInterval = setInterval(function(){

                that.send(JSON.stringify([CONSTANTS.OcppCallType.ClientToServer, that.msgId(), "Heartbeat", {}])); // ocpp heartbeat request

            }, this.ocppHeartBeatIntervalMs);

        }
        else{
            console.error("Do not know what to do with following received message")
            console.log(data)   
        }


    });

    this.instance.on('close', function clear(code, reason) {
        console.log(that.clientId + "Websocket closed. Code: " + code);
        switch (code) { // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
            case 1000: //  1000 indicates a normal closure, meaning that the purpose for which the connection was established has been fulfilled.
                console.log(that.clientId + "WebSocket: closed");
                break;
            case 1006: //Close Code 1006 is a special code that means the connection was closed abnormally (locally) by the browser implementation.	
                console.log(that.clientId + "WebSocket: closed abnormally");
                //debugger;
                that.reconnect(code);
                break;
            default: // Abnormal closure
                //debugger;
                console.log(that.clientId + "WebSocket: closed unknown");
                that.reconnect(code);
                break;
        }

        clearTimeout(this.pingTimeout);
    });

    this.instance.on('error', function(e) {
        console.error(e);
        switch (e.code) {
            case 'ECONNREFUSED':
                console.error(this.clientId + "Error ECONNREFUSED. Server is not accepting connections");
                that.reconnect(e);
                break;
            default:
                console.error(this.clientId + "UNKNOWN ERROR");
                break;
        }
    });
}

WebSocketClient.prototype.msgId = function(){ // msg ID incrementer
    let inc = CP_ID + "_" +  this.ocppMessageCounter++; // to string
    return inc;
}

WebSocketClient.prototype.send = function(data, option) {
    try {
        console.log(this.clientId + " Sending no." + this.ocppMessageCounter + " data to CS: " + JSON.stringify(data));
        this.instance.send(data, option);
    } catch (e) {
        this.instance.emit('error', e);
    }
}

WebSocketClient.prototype.reconnect = function(e) {
    var that = this;
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    this.instance.removeAllListeners();
    clearInterval(this.ocppHeartBeatInterval);
    
    setTimeout(function() {
        
        console.log("WebSocketClient retry reconnecting ...");
        that.open(that.url);

    }, this.autoReconnectInterval);
}

// CONCURRENCY SETUP - running multiple clients

var CP_ID, URL, wsc;

for (let clientIdx=0; clientIdx<CONCURRENCY_LEVEL; clientIdx++){

    // build chargepoint identity - required by protocol 
    CP_ID = 'SI-' + uuidv4(); // required by protocol 
    URL = `${CS_PROTOCOL}://${CS_HOST}:${CS_PORT}/${CP_ID}?cid=${clientIdx}`; // central system url
    console.log(clientIdx + " - Trying to connect to: " + URL);
    
    // create a client
    wsc = new WebSocketClient(clientIdx);
    wsc.open(URL);

}

// TEST SEQUENCE
/*
let CP_ID = 'SI-' + uuidv4(); // required by protocol 
let URL = `${CS_PROTOCOL}://${CS_HOST}:${CS_PORT}/${CP_ID}`; // central system url
console.log("Trying to connect to: " + URL);

// create a client
let wsc = new WebSocketClient();
wsc.open(URL);
*/

