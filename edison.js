/**
 * Created by emmanuel on 2/4/17.
 */

var five   = require("johnny-five");
var Edison = require("edison-io");
var board  = new five.Board({
    io: new Edison()
});

const WebSocket = require('ws');
var ws_ready = false;

const ws = new WebSocket('ws://192.168.20.35/input');

ws.on('open', function open() {
    ws_ready = true;
});

var ip = require('ip');

board.on("ready", function () {

    // Plug the MMA7660 Accelerometer module
    // into an I2C jack
    var acceleration = new five.Accelerometer({
        controller: "MMA7660"
    });

    acceleration.on("change", function () {
        console.log("accelerometer");
        console.log("  x            : ", this.x);
        console.log("  y            : ", this.y);
        console.log("  z            : ", this.z);
        console.log("  pitch        : ", this.pitch);
        console.log("  roll         : ", this.roll);
        console.log("  acceleration : ", this.acceleration);
        console.log("  inclination  : ", this.inclination);
        console.log("  orientation  : ", this.orientation);
        console.log("--------------------------------------");

        if (ws_ready) {
            ws.send(JSON.stringify({'id': ip.address(), 'x': this.x, 'y': this.y, 'z': this.z }));
        }
    });


});
