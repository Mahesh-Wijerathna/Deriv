const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const winston = require('winston');
const app = express();

const PORT = 4000;
const apiToken = 'l7LLGTxAT6qn9v9';

let ws = null;
let date = null;
let bullishSignal = false;
let bearishSignal = false;
let data = [];
let server = null;


function startServer  () {
    server = app.listen(PORT, () => {
        logger.warn(`server started`);
        console.log(`http://localhost:${PORT}    bearish and bullish engulfing pattern    15 simple moving average`);
    });
};
function stopServer  ()  {
    if (server) {
        server.close(() => {
            console.log('Server stopped');
            logger.warn('server stopped');            
        });
    }
    ws = null;
    date = null;
    bullishSignal = false;
    bearishSignal = false;
    data = [];
    server = null;
};
app.get('/restart', (req, res) => {
    stopServer();
    startServer();
    logger.warn('Server restarted');
    console.log('Server restarted');
    res.send("Server restarted");
});
app.get('/start', (req, res) => {
    if (ws) {
        res.send("WebSocket connection already started");        
        return; 
    }
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');    
    ws.on('open', () => {
        console.log('Trying to authorize');
        logger.warn('Trying to authorize');
        ws.send(JSON.stringify({ authorize: apiToken }));
    });
    ws.on('message', (message) => {
        const response = JSON.parse(message);
        if (response.msg_type === 'ohlc') {
            date = new Date(response.ohlc.epoch* 1000);
            if(date.getSeconds() === 0) {
                if(bullishSignal)
                    bullishTrade();
                else if(bearishSignal)
                    BearishTrade();
            }
            else if(date.getSeconds() === 58) {
                data.push([
                    Number(response.ohlc.open),
                    Number(response.ohlc.close),
                    Number(response.ohlc.low),
                    Number(response.ohlc.high)
                ]);
                logger.info({candle : {open: response.ohlc.open, close: response.ohlc.close, low: response.ohlc.low, high: response.ohlc.high}});
                bullishSignal = setBullishSignal();
                bearishSignal = setBearishSignal();
                logger.info({"bullishSignal": bullishSignal, "bearishSignal": bearishSignal}); 
            }
            
            
        }
        else if (response.msg_type === 'candles') {
            data.length = 0; 
            response.candles.forEach(candle => {                
                data.push([candle.open, candle.close, candle.low, candle.high]);
            });
            logger.info(response.candles);
        }      
        else if(response.msg_type === 'authorize') {
            console.log('Authorization was successful');
            logger.warn('Authorization was successful');
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
            logger.warn('Requesting 20 candles');
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
            logger.warn('Subscribing to 1-minute candles');         
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
app.get('/warn', (req, res) => {
    fs.readFile('logs/warn.log', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading log file');
        }
        res.type('text/plain');  // Serve the logs as plain text
        res.send(data);
    });
});
app.get('/info', (req, res) => {
    fs.readFile('logs/info.log', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading log file');
        }
        res.type('text/plain');  // Serve the logs as plain text
        res.send(data);
    });
});
app.get('/', (req, res) => {
    res.send({data: data});
});

function BearishTrade  () {
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
function bullishTrade  ()  {
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

function setBearishSignal  ()  {
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
    logger.info({"last": last, "previous": previous});
    logger.info({"currentCandle": currentCandle, "previousCandle": previousCandle});
    if (isBearishEngulfing && last < previous) {
        logger.warn("Bearish Engulfing Pattern Detected:", previousCandle, currentCandle);
        return true;
    }
    return false;
};
function setBullishSignal  ()  {
    if (data.length < 2) return 0;
    const [currentCandle, previousCandle] = [data[data.length - 1], data[data.length - 2]];

    const isBullishEngulfing = (
        previousCandle[0] > previousCandle[1] && // Previous candle is bearish
        currentCandle[1] > previousCandle[0] && // Close of current > Open of previous
        currentCandle[0] < previousCandle[1]    // Open of current < Close of previous
    );
    
    const last = calculateAverage(data.length - 16, data.length - 2);
    const previous = calculateAverage(data.length - 15, data.length - 1);
    logger.info({"last": last, "previous": previous});
    logger.info({"currentCandle": currentCandle, "previousCandle": previousCandle});
    if (isBullishEngulfing && last > previous) {
        logger.warn("Bullish Engulfing Pattern Detected:", previousCandle, currentCandle);
        return true;
    }
    return false;
}

function calculateAverage  (startIndex, endIndex)  {
    // console.log(startIndex, endIndex, data.length);
    // logger.info({"startIndex": startIndex, "endIndex": endIndex, "dataLength": data.length});
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
    // logger.info({"average": sum / count});
    return sum / count;
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: () => new Date().toISOString() // ISO string in GMT 0
        }),
        winston.format.printf(({ level, message, timestamp }) => {
            return JSON.stringify({
                level: level,
                timestamp: timestamp,
                message: message
            });
        })
    ),
    transports: [
        new winston.transports.File({ level: 'info', filename: 'logs/info.log' }),
        new winston.transports.File({ level: 'warn', filename: 'logs/warn.log' }),
    ],
});
startServer();