# OCPP 1.6 Central System and ChargePoint Emulator

# Install 

1. Download [Node.js](https://nodejs.org/en/download/). You can use  

2. Goto root folder of repo (where packages.json file is present) and install required NPM packages with:

```bash
npm install
```
# To start server

Open shell in root folder and start server
```bash
npm run start-server
```

# To start client

Open shell in root folder and start server
```bash
npm run start-client
```

# Start under docker 

Attached **Dockerfile** demonstrates procedure for starting node application with docker. Important point is to install packages with node package manager (npm), copy source file over and then use custom scripts defined inside package.json to start node via npm. 

Another approach can be used if you like. 

# Some general info on inner flow

## Server

1. Servers accepts client conections and upgrades them to websocket protocol
2. It responds to various OCPP messages
3. Ocasionally it send PING / PONG to determine which clients are still alive

## Client

1. When client connects with websocket, it sends boot notification. 
2. After response is recevied, it reads heartbeat interval from it
3. it send heartbeat message according to interval

# Environment variables

## Environment variables that client script uses

1. **CS_PROTOCOL** defaults to **ws**. possible values are: ws, wss (for SSL)
2. **CS_HOST** defaults to **localhost**. host to connect to
3. **CS_PORT** defaults to **8080**. port to connect to
4. **CONCURRENCY_LEVEL** defaults to 1. Number of clients to create
5. **LOG_PAYLOAD**  verbose logging of data exchange between client and server
6. **LOG_LIFECYCLE** = log lifecyle events (connect, reconnect, pingpong)

## Environment variables that server script uses

1. **WEB_SRV_HOST** interface to bind to (could be only one)
2. **WEB_SRV_PORT** port on bind interface
3. **HEARTBEAT_INT_MS** interval in which we check client if its still connected
4. **LOG_PAYLOAD**  verbose logging of data exchange between client and server
5. **LOG_LIFECYCLE** = log lifecyle events (connect, reconnect, pingpong)

# Debugging

## Manually start server

```bash
node ocpp-central-cystem-server.js
```

## Manually start client 
```bash
node ocpp-chargepoint-client.js
```
## Debug with debugger

1. Install extension for debugging in chrome browser

Node.js V8 --inspector Manager (NiM]

2. Start NiM extension in Chrome:

Open <about://inspect> in a new tab 

3. Start node script with inspect enabled. 

```bash
node --inspect-brk ocpp-chargepoint-client.js
```

4. After a few seconds you should see Target upgradeServer.js on your chrome tab. Click on inspect link and new DevTools window will appear with source code.