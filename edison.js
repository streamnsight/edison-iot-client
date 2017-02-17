/**
 * Created by emmanuel on 2/4/17.
 */

var SERVER_IP = os.getenv('SERVER_IP');
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
    light: false,
    button: true,
    lcd: true
};

var lcd = null;

// Websocket Client
// import websocket
const WebSocket = require('ws');
// flag to check on Websocket open
var wsReady = false;
// Websocket server URL
const wsServerURL = 'ws://' + SERVR_IP + ':3001/input';

// create connection
var ws = new WebSocket(wsServerURL);
attachListeners();

// on connection open, set wsReady flag
function open() {
    wsReady = true;
}

function error(error) {
    console.log(error);
}

function close() {
    wsReady = false;
    ws      = new WebSocket(wsServerURL);
    attachListeners();
}

function receiveData(data) {
    try {
        var message = JSON.parse(data);
        console.log(message);
        if (lcd) {
            var lcd_text = message.data && message.data.lcd && message.data.lcd.text ? message.data.lcd.text : "error";
            lcd.cursor(0, 0).print("                "); //clear LCD
            lcd.cursor(1, 0).print("                ");
            lcd.cursor(0, 0).print(lcd_text.substring(0,16)); //print
            lcd.cursor(1, 0).print(lcd_text.substring(16,32));
        }
    }
    catch (e) {
        console.log(e.message);
    }
}

function attachListeners() {
    ws.on('open', open);
    ws.on('error', error);
    ws.on('close', close);
    ws.on('message', receiveData);
}

function sendData(data) {
    if (wsReady) {
        var d       = new Date();
        var message = {
            'meta': {
                'id': ip.address(),
                'timestamp': d.toISOString()
            },
            'data': data
        };
        console.log(JSON.stringify(message));
        ws.send(JSON.stringify(message));
    }
}

// use a running average to smooth out variability from the sensors
function runningAverage(avg, new_sample, n) {
    avg -= avg / n;
    avg += new_sample / n;
    return avg;
}

// if under threshold, will return
function sendThreshold(new_value, avg, threshold) {
    return Math.abs(avg - new_value) < threshold;
}

// on board ready, init sensors
board.on("ready", function () {

    if (sensors.lcd) {
        lcd = new five.LCD({
            controller: "JHD1313M1"
        });
    }

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
        // into the Grove Shield's A1 jack
        var thermometer = new five.Thermometer({
            controller: "GROVE",
            pin: "A1"
        });

        // Init temperature variables
        var f = 0, c = 0;

        thermometer.on("data", function () {

            // skip if temperature didn't change
            if (sendThreshold(f, runningAverage(f, this.fahrenheit, 10), 1)) {
                return;
            }

            f = runningAverage(f, this.fahrenheit, 10);
            c = runningAverage(c, this.celsius, 10);
            sendData({'temperature_celsius': c, 'temperature_fahrenheit': f});
        });
    }

    if (sensors.potentiometer) {
        // Plug the Rotary Angle sensor module
        // into the Grove Shield's A0 jack
        var rotary = new five.Sensor("A0");
        var p      = 0;

        rotary.scale(0, 255).on("change", function () {

            if (sendThreshold(p, runningAverage(p, this.value, 10), 1)) {
                return;
            }
            p = runningAverage(p, this.value, 10);
            sendData({'potentiometer': p});
        });
    }

    if (sensors.light) {
        // Plug the Grove TSL2561 Light sensor module
        // into an I2C jack
        var light = new five.Light({
            controller: "TSL2561"
        });

        var l = 0;

        light.on("change", function () {
            if (sendThreshold(this.level, l, 1)) {
                return;
            }
            l = runningAverage(l, this.level, 5);
            sendData({"light": l});
            //console.log("Ambient Light Level: ", this.level);
        });
    }

    if (sensors.sound) {
        console.log("sound sensor not supported");
    }
});
