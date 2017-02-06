/**
 * Created by emmanuel on 2/4/17.
 */

// import johnny5 framework
var five = require("johnny-five");
// import edison board plugin ofr johnny5
var Edison = require("edison-io");
// helper to easily capture the board's IP
var ip = require('ip');
// init board
var board = new five.Board({
    io: new Edison()
});

// define what sensors are plugged in
var sensors = {
    accelerometer: true,
    potentiometer: true,
    sound: false,
    temperature: true,
    light: true
};


// Websocket Client
// import websocket
const WebSocket = require('ws');
// flag to check on Websocket open
var wsReady = false;
// Websocket server URL
const wsServerURL = 'ws://192.168.20.35/input';
// create connection
const ws = new WebSocket(wsServerURL);
// on connection open, set wsReady flag
function open() {
    wsReady = true;
}

function error(error){
    console.log(error);
}

function close(){
   ws.connect(wsServerURL, open)
}

function sendData(data) {
    if (wsReady) {
        var message = {
            'meta': {'id': ip.address()},
            'data': data
        };
        ws.send(JSON.stringify(JSON.stringify(message)));
    }
}

function receiveData(data) {

}

ws.on('open', open);
ws.on('error', error);
ws.on('close', close);
ws.on('message', receiveData);

// on board ready, init sensors
board.on("ready", function () {

    if (sensors.accelerometer) {
        // Plug the MMA7660 Accelerometer module
        // into an I2C jack
        var acceleration = new five.Accelerometer({
            controller: "MMA7660"
        });

        // on accelerometer update,
        acceleration.on("change", function () {

            var data = {
                'accel_x': this.x,
                'accel_y': this.y,
                'accel_z': this.z,
                'pitch': this.pitch,
                'roll': this.roll,
                'yaw': this.yaw,
                'acceleration': this.acceleration,
                'inclination': this.inclination,
                'orientation': this.orientation
            };

            console.log(JSON.stringify(data));
            // if websocket open, send the data
            sendData(data);
        });
    }

    if (sensors.button) {
        // Plug the Button module into the
        // Grove Shield's D4 jack
        var button = new five.Button(4);

        // The following will data as the button is
        // pressed and released.
        button.on("press", function () {
            sendData({'button': 'pressed'});
        });
        button.on("release", function () {
            sendData({'button': 'released'});
        });
    }

    if (sensors.temperature) {
        // Plug the Temperature sensor module
        // into the Grove Shield's A0 jack
        var thermometer = new five.Thermometer({
            controller: "GROVE",
            pin: "A0"
        });

        // Init temperature variables
        var f = 0, c = 0;

        thermometer.on("data", function () {

            // skip if temperature didn't change
            if (f === Math.round(this.fahrenheit)) {
                return;
            }

            f = Math.round(this.fahrenheit);
            c = Math.round(this.celsius);
            sendData({'temperature_celsius': c, 'temperature_fahrenheit': f});
        });
    }

    if (sensors.potentiometer) {
        // Plug the Rotary Angle sensor module
        // into the Grove Shield's A0 jack
        var rotary = new five.Sensor("A0");
        rotary.scale(0, 255).on("change", function () {
            sendData({'potentiometer': this.value});
        });
    }

    if (sensors.light) {
        // Plug the Grove TSL2561 Light sensor module
        // into an I2C jack
        var light = new five.Light({
            controller: "TSL2561"
        });

        light.on("change", function () {
            sendData({"light": this.level});
            //console.log("Ambient Light Level: ", this.level);
        });
    }

    if (sensors.sound) {
        console.log("sound sensor not supported");
    }
});
