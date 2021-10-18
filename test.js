'use strict';

const WebSocket = require('ws');
const UTILS = require('./utils.js')

UTILS.Fn.log("String with json" , "{\"a\":1}", UTILS.Color.Yellow);
UTILS.Fn.log("javascript object" , {a:1}, UTILS.Color.Magenta);
UTILS.Fn.log("no color" , {a:1}, UTILS.Color.Red);

UTILS.Fn.data("I got this data " , {a:2});
UTILS.Fn.err("Major malfunction");

UTILS.Fn.err("Error reporting ", new Error('A standard error'));

/*
console.log("Displaying log colors");
for (const color in UTILS.Color) {
	UTILS.Fn.log(`Testing 123 ${color} `, UTILS.Color[color]);
}
console.log("Test finished");
*/

