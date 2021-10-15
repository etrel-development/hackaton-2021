# Simulator of Starfish Websockets (IIS application)

# Description

We want to test how well starfish comunication channel is handling various network errors. 
In this repo there is starfish server (aka CentralSystem) and client (Chargepoint).
Autoreconnect is implemented.

We can then connect with server or client to real ocean or CP and test various scenarious:

1. Cable unpluged
1. process killed
1. Extra timeout (delay)
1. Client forcefully disconnected


# Install 

1. Download [Node.js](https://nodejs.org/en/download/) 

2. Goto root folder of repo (where packages.json file is present) and install required NPM packages

```bash
npm install
```

##  Start server

Open shell (cmd.exe) in root folder and start server

```bash
node upgradeServer.js
```

##  Starting  clients

### General test tools  (no support ocpp protocol)

**client.js** is used to test websocket connection (does not support ocpp protocol).
**main.js** is barebone websocket server (does not support ocpp protocol).

### OCPP Test tools 

#### ocppclient.js

**ocppclient.js** is used to connect to ocean central system and send boot notification and periodically heartbeats using JSON.

#### soapOcppclient.js

**soapOcppclient.js** is used to connect to ocean central system and send boot notification and periodically heartbeats using SOAP. 
Supoports 1.6 soap and 1.5 soap. You need to use 

#### ocppChargerClient.js

**ocppChargerClient.js** simulates one charging session as follows:

1. When client connects with websocket, we send boot notification. 
2. After 5s we transition to preparing status (we send statusNotification).
3. After 5s we start transaction and transition to charging status. 
4. After 2s we send meter values (we repeat this 5 times).
5. Then we transition to finishing status and after 5s we send stop transaction. 
6. After 5s we transition to Available status.

Open shell (cmd.exe) and start client (you can have many clients)

```bash
node ocppChargerClient.js
```

# Debugging

1. Install extension for debugging in chrome browser

Node.js V8 --inspector Manager (NiM]

2. Start NiM extension in Chrome:

Open <about://inspect> in a new tab 

3. Start node script with inspect enabled. 

```bash
node --inspect-brk upgradeServer.js
```

4. After a few seconds you should see Target upgradeServer.js on your chrome tab. Click on inspect link and new DevTools window will appear with source code.

# Literature

## Node.js Websocket NPM package

[node ws ](https://github.com/websockets/ws/)

[node ws test](https://github.com/websockets/ws/blob/master/test/websocket.test.js)
