const WebSocket = require('ws');
const apiToken = 'l7LLGTxAT6qn9v9';
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

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
        buy: 1,
        price: 1, // Price to buy
        parameters: {
            contract_type: 'ONETOUCH',
            duration: 2,
            duration_unit: 'm',
            symbol: 'R_100',
            currency: 'USD',
            basis: 'stake',
            barrier: '+0.34',
            amount: 0.5
        }
    };

    ws.send(JSON.stringify(buyParams));
};

let start = 0;
let low = 0;
let high = 0;
let signals = false;

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

            if (bearishEngulf() > 0) signals = true;
        }
    }
};


const express = require('express');
const app = express();
const PORT = 4000;

app.get('/start', async (req, res) => {
    ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: apiToken }));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data);
        switch (response.msg_type) {
            case 'authorize':
                console.log('Authorized:', response);
                break;
            case 'tick':
                console.log('Tick:', response);
                break;
            default:
                console.log('Unhandled response:', response);
        }
    });

    res.send("WebSocket connection started and message handlers set up");
});

ws.on('error', (error) => {
    console.error("WebSocket Error:", error);
});

app.get('/close', (req, res) => {
    ws.close();
    server.close(() => {
        console.log('Express server closed');
    });
    res.send("WebSocket connection and Express server closed");
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});