const WebSocket = require('ws');
const express = require('express');
const e = require('express');
const app = express();

const PORT = 4000;
const apiToken = 'l7LLGTxAT6qn9v9';

let ws = null;
let date = null;
let bullishSignal = false;
let bearishSignal = false;
let data = [];
let server = null;

server = app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}
    bearish and bullish engulfing pattern
    15 simple moving average`);
});
app.get('/start', (req, res) => {
    if (ws) {
        res.send("WebSocket connection already started");
        return; 
    }
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');    
    ws.on('open', () => {
        console.log('Trying to authorize');
        ws.send(JSON.stringify({ authorize: apiToken }));
    });
    ws.on('message', (message) => {
        const response = JSON.parse(message);
        if (response.msg_type === 'ohlc') {
            date = new Date(response.ohlc.epoch* 1000);
            // console.log(date.getMinutes(), date.getSeconds());
            if(date.getSeconds() === 0) {
                if(bullishSignal)
                    bullishTrade();
                else if(bearishSignal)
                    BearishTrade();
            }
            else if(date.getSeconds() === 58) {
                // console.log('ready to buy');
                data.push([
                    Number(response.ohlc.open),
                    Number(response.ohlc.close),
                    Number(response.ohlc.low),
                    Number(response.ohlc.high)
                ]);
                bullishSignal = setBullishSignal();
                bearishSignal = setBearishSignal();
            }
            
        }
        else if (response.msg_type === 'candles') {
            data.length = 0; 
            response.candles.forEach(candle => {                
                data.push([candle.open, candle.close, candle.low, candle.high]);
            });
        }      
        else if(response.msg_type === 'authorize') {
            console.log('Authorization was successful');
            ws.send(JSON.stringify({
                ticks_history: 'R_100', // Replace 'R_100' with the appropriate symbol
                adjust_start_time: 1,
                count: 20,
                end: 'latest',
                start: 1,
                style: 'candles',
                granularity: 60 // 1-minute candles
            }));
            console.log('Requesting 20 candles');
            ws.send(JSON.stringify({
                ticks_history: 'R_100',
                adjust_start_time: 1,
                count: 1,
                end: 'latest',
                start: 1,
                style: 'candles',
                granularity: 60, 
                subscribe: 1
            })); 
            console.log('Subscribing to 1-minute candles');           
        }
        else if(response.msg_type === 'buy') {
            console.log('Buy response:', response);
        }
        
        else if(response.msg_type === 'error') {
            console.error('Error response:', response);
        }
        else {
            console.log('Unhandled response:', response);
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
        ws = null;
    }
    res.send("WebSocket connection closed");
});
app.get('/', (req, res) => {
    res.send({data: data});
});

const BearishTrade = () => {
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
const bullishTrade = () => {
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

const setBearishSignal = () => {
    if (data.length < 2) return 0;
    // console.log('bearish');
    const [currentCandle, previousCandle] = [data[data.length - 1], data[data.length - 2]];

    const isBearishEngulfing = (
        previousCandle[0] < previousCandle[1] && // Previous candle is bullish
        currentCandle[1] < previousCandle[0] && // Close of current < Open of previous
        currentCandle[0] > previousCandle[1]    // Open of current > Close of previous
    );
    
    const last = calculateAverage(data.length - 16, data.length - 2);
    const previous = calculateAverage(data.length - 15, data.length - 1);
    
    if (isBearishEngulfing && last < previous) {
        console.log("Bearish Engulfing Pattern Detected:", previousCandle, currentCandle);
        return true;
    }
    return false;
};
const setBullishSignal = () => {
    if (data.length < 2) return 0;
    // console.log('bullish');
    const [currentCandle, previousCandle] = [data[data.length - 1], data[data.length - 2]];

    const isBullishEngulfing = (
        previousCandle[0] > previousCandle[1] && // Previous candle is bearish
        currentCandle[1] > previousCandle[0] && // Close of current > Open of previous
        currentCandle[0] < previousCandle[1]    // Open of current < Close of previous
    );
    
    const last = calculateAverage(data.length - 16, data.length - 2);
    const previous = calculateAverage(data.length - 15, data.length - 1);
    
    if (isBullishEngulfing && last > previous) {
        console.log("Bullish Engulfing Pattern Detected:", previousCandle, currentCandle);
        return true;
    }
    return false;
}

const calculateAverage = (startIndex, endIndex) => {
    // console.log(startIndex, endIndex, data.length);
    if (startIndex < 0 || endIndex >= data.length || startIndex > endIndex) {
        return 0;
    }
    let sum = 0;
    let count = 0;
    for (let i = startIndex; i <= endIndex; i++) {
        sum += data[i][1]; 
        count++;
    }
    // console.log(startIndex, endIndex,count, sum/count);
    return sum / count;
};