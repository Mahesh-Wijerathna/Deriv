const WebSocket = require('ws');
const express = require('express');
const app = express();
const PORT = 4000;
const apiToken = 'l7LLGTxAT6qn9v9';

let ws;

app.get('/start', (req, res) => {
    if (ws) {
        res.send("WebSocket connection already started");
        return; // Stop executing the rest of the code
    }
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    
    ws.on('open', () => {
        console.log('Trying to authorize');
        ws.send(JSON.stringify({ authorize: apiToken }));
    });

    ws.on('message', (message) => {
        const response = JSON.parse(message);

        if (response.msg_type === 'tick') {
            const tick = response.tick;
            watching(tick.quote, tick.epoch*1000); // Call the watching function with the current price and epoch time
        }
        if(response.msg_type === 'authorize') {
            console.log('Authorization was successful');
            ws.send(JSON.stringify({ ticks: 'R_100', subscribe: 1 }));
        }
        if(response.msg_type === 'buy') {
            console.log('Buy response:', response);
        }
        if(response.msg_type === 'error') {
            console.error('Error response:', response);
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

app.get('/', (req, res) => {
    res.send({data: data});
});

server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let start = 0;
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
        return true;
    }
    return false;
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
            barrier: '-0.34',
            amount: 0.5
        }
    };

    ws.send(JSON.stringify(buyParams));
};

const watching = (currentPrice, epochTime) => {
    // console.log("watching");
    const date = new Date(epochTime);
    const seconds = date.getSeconds();

    if (seconds === 0) {
        if (signals) {
            buy();
            signals = false;            
        }
        console.log("Time : "+ date.getHours(),date.getMinutes(),seconds ,date.getMilliseconds() + "\nStart " + currentPrice);
        low = high = start = currentPrice;
    } else {
        low = Math.min(low, currentPrice);
        high = Math.max(high, currentPrice);

        if (seconds === 58) {
            data.push([start, currentPrice, low, high]);
            if (data.length > 2) data.shift();
            signals = bearishEngulf(); 

        }
    }
};