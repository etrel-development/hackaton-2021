# OCPP 1.6 Central System and ChargePoint Emulator

# Install 

1. Download [Node.js](https://nodejs.org/en/download/) 

2. Goto root folder of repo (where packages.json file is present) and install required NPM packages

```bash
npm install
```

##  Start server

Open shell in root folder and start server

```bash
node ocpp-central-cystem-server.js
```

### Some general info on inner flow

1. Servers accepts client conections and upgrades them to websocket protocol
2. It responds to various OCPP messages
3. Ocasionally it send PING / PONG to determine which clients are still alive

##  Starting  clients

Open shell in root folder and start client

```bash
node ocpp-chargepoint-client.js
```

### Environment variables that client script uses

1. **CS_PROTOCOL** defaults to **ws**. possible values are: ws, wss (for SSL)
2. **CS_HOST** defaults to **localhost**. host to connect to
3. **CS_PORT** defaults to **8080**. port to connect to


### Some general info on inner flow

1. When client connects with websocket, it sends boot notification. 
2. After response is recevied, it reads heartbeat interval from it
3. it send heartbeat message according to interval

# Debugging

1. Install extension for debugging in chrome browser

Node.js V8 --inspector Manager (NiM]

2. Start NiM extension in Chrome:

Open <about://inspect> in a new tab 

3. Start node script with inspect enabled. 

```bash
node --inspect-brk ocpp-chargepoint-client.js
```

4. After a few seconds you should see Target upgradeServer.js on your chrome tab. Click on inspect link and new DevTools window will appear with source code.

# Using utility scripts

## To start server

```bash
npm run start-server
```

## To start client

```bash
npm run start-client
```

# Literature

## Node.js Websocket NPM package

[node ws ](https://github.com/websockets/ws/)

[node ws test](https://github.com/websockets/ws/blob/master/test/websocket.test.js)
