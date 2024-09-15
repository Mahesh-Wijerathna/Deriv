const WebSocket = require('ws');
const express = require('express');
const app = express();
const PORT = 4000;

let ws;
let server;

app.get('/start', (req, res) => {
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.on('open', () => {
        console.log('WebSocket connection opened');
        ws.send(JSON.stringify({ ticks: 'R_100' })); // Replace 'R_100' with the appropriate symbol
    });

    ws.on('message', (message) => {
        const response = JSON.parse(message);
        console.log('Received data:', response);

        if (response.tick) {
            const tick = response.tick;
            watching(tick.quote, tick.epoch); // Call the watching function with the current price and epoch time
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    res.send("WebSocket connection started ");
});

app.get('/close', (req, res) => {
    if (ws) {
        ws.close();
    }
    res.send("WebSocket connection closed");
});

server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let low = 0;
let high = 0;
let signals = false;
const data = [];

const bearishEngulf = () => {
    if (data.length < 2) return 0;
    
    const [currentCandle, previousCandle] = [data[data.length - 1], data[data.length - 2]];

    const isBearishEngulfing = (
        previousCandle[0] < previousCandle[1] && // Previous candle is bullish
        currentCandle[1] < previousCandle[0] && // Close of current < Open of previous
        currentCandle[0] > previousCandle[1]    // Open of current > Close of previous
    );

    if (isBearishEngulfing) {
        console.log("Bearish Engulfing Pattern Detected:", currentCandle, previousCandle);
        return 1;
    }
    return 0;
};

const buy = () => {
    const buyParams = {
        // Your buy parameters here
    };
    // Your buy logic here
};

const watching = (currentPrice, epochTime) => {
    console.log("watching");
    const date = new Date(epochTime);
    const seconds = date.getSeconds();
    console.log(seconds);
    console.log(data);

    if (seconds === 0) {
        if (signals) {
            buy();
            signals = false;
        }
        low = high = start = currentPrice;
    } else {
        low = Math.min(low, currentPrice);
        high = Math.max(high, currentPrice);

        if (seconds === 58) {
            data.push([start, currentPrice, low, high]);
            if (data.length > 2) data.shift();
            bearishEngulf(); // Call the bearishEngulf function to check for the pattern
        }
    }
};