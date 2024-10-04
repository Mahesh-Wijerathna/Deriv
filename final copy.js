const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const { simpleMovingAverage } = require('./indicators.js');

const PORT = 4000;
const app = express();
const apiToken = 'l7LLGTxAT6qn9v9';

let used = 0;
let max = 3;
let ws = null;
let date = null;
let bullishSignal = false;
let bearishSignal = false  ;
let data_ = [];
let lastWatchedTime = null;
let socketStatus = 'closed';

function getWatchTime() {
    try {
        if (date)
            lastWatchedTime = `${date.getHours()} : ${date.getMinutes()} : ${date.getSeconds()} `;
        else
            lastWatchedTime = 'Still NULL';
    } catch (err) {
        logger.error('Error in getWatchTime: ' + err.message);
    }
}
// Routes
app.get('/error', (req, res) => {
    try {
        fs.readFile('logs/error.log', 'utf8', (err, data) => {
            res.type('text/plain');
            res.send(data);
        });
    } catch (err) {
        logger.error('Error in /error route: ' + err.message);
    }
});

app.get('/warn', (req, res) => {
    try {
        fs.readFile('logs/warn.log', 'utf8', (err, data) => {
            res.type('text/plain');
            res.send(data);
        });
    } catch (err) {
        logger.error('Error in /warn route: ' + err.message);
    }
});

app.get('/info', (req, res) => {
    try {
        fs.readFile('logs/info.log', 'utf8', (err, data) => {
            res.type('text/plain');
            res.send(data);
        });
    } catch (err) {
        logger.error('Error in /info route: ' + err.message);
    }
});

app.get('/restart', (req, res) => {
    try {
        restartServer();
        res.send({ "server Status": 'restarted' });
    } catch (err) {
        logger.error('Error in /restart route: ' + err.message);
    }
});

app.get('/close', (req, res) => {
    try {
        closeSocket();
        res.send({ "socket Status": 'closed' });
    } catch (err) {
        logger.error('Error in /close route: ' + err.message);
    }
});

app.get('/open', (req, res) => {
    try {
        openSocket();
        res.send({ "socket Status": socketStatus });
    } catch (err) {
        logger.error('Error in /open route: ' + err.message);
    }
});

app.get('/test', (req, res) => {
    try {
        res.send({ 'max': max });
    } catch (err) {
        logger.error('Error in /test route: ' + err.message);
    }
});

app.get('/', (req, res) => {
    try {
        getWatchTime();
        res.send({ 'last time data': { 'time': lastWatchedTime, 'data': data_ } });
    } catch (err) {
        logger.error('Error in / route: ' + err.message);
    }
});

// Server functions
function restartServer() {
    try {
        stopServer();
        startServer();
        console.log('Server restarting...');
    } catch (err) {
        logger.error('Error in restartServer: ' + err.message);
    }
}

function stopServer() {
    try {
        closeSocket();
        server.close();
    } catch (err) {
        console.log('Error in stopServer: ' + err.message);
    }
}
function closeSocket() {
    try {
        if (ws != null) {
            ws.close();
            ws = null;
            socketStatus = 'closed';
        } else {
            socketStatus = 'already closed';
        }
    } catch (err) {
        logger.error('Error in closeSocket: ' + err.message);
    }
}
function authHandler(){
    console.log('Authorized');    
    ws.send(JSON.stringify({
        ticks_history: 'R_10',
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

function checking() {
    try {
        let type = null;
        // console.log();
        if(data_[data_.length - 1].close > data_[data_.length - 1].open) {
            type = 'bullish';
        } else {
            type = 'bearish';
        }
        const sma_last = simpleMovingAverage(data_.map(candle => candle.close), 20);
        if(type === 'bullish') {
            // console.log(sma_last);
            if(data_[data_.length - 2].close < data_[data_.length - 2].open
                && sma_last[sma_last.length - 1] - sma_last[sma_last.length - 2] > 0.45
            ) {
                
                bullish_signal = true;         
                // const temp_support = Math.min(data_[data_.length - 2].close, data_[data_.length - 1].open);
                // temp_supports.push([temp_support, 0]);
            }
            else
                bullish_signal = false;
        }
        else if(type === 'bearish') {
            if(data_[data_.length - 2].close > data_[data_.length - 2].open
                && sma_last[sma_last.length - 2] - sma_last[sma_last.length - 1] > 0.45
            ) {
                // console.log('resistance');
                bearish_signal = true;
                // const temp_resistance = Math.max(data_[data_.length - 2].close, data_[data_.length - 1].open);
                // temp_resistances.push([temp_resistance, 0]);
            }
            else
                bearish_signal = false;
        }
    } catch (err) {
        logger.error('Error in checking: ' + err.message);
    }
}

let bullish_signal = false;
let bearish_signal = false;
function takeContract() {
    if(bullish_signal) {
        ws.send(JSON.stringify({
            buy: 1,
            price: 1,
            parameters: {
                contract_type: 'ONTOUCH',
                symbol: 'R_10',
                duration: 2,
                duration_unit: 'm',
                basis: 'stake',
                amount: 0.5,
                barrier: `+0.2`,
                currency: 'USD'
            }
        }));
    } else if(bearish_signal) {
        ws.send(JSON.stringify({
            buy: 1,
            price: 1,
            parameters: {
                contract_type: 'ONTOUCH',
                symbol: 'R_10',
                duration: 2,
                duration_unit: 'm',
                basis: 'stake',
                amount: 0.5,
                barrier: `-0.2`,
                currency: 'USD'
            }
        }));
    }
}

let temp_supports = [];
let temp_resistances = [];
function calculateTempSupportsAndResistances() {
    let type = null;
    // console.log();
    if(data_[data_.length - 1].close > data_[data_.length - 1].open) {
        type = 'bullish';
    } else {
        type = 'bearish';
    }
    const sma_last = simpleMovingAverage(data_.map(candle => candle.close), 20);
    if(type === 'bullish') {
        // console.log(sma_last);
        if(data_[data_.length - 2].close < data_[data_.length - 2].open
            && sma_last[sma_last.length - 1] - sma_last[sma_last.length - 2] > -0.45
        ) {
            
            bullish_signal = true;         
            // const temp_support = Math.min(data_[data_.length - 2].close, data_[data_.length - 1].open);
            // temp_supports.push([temp_support, 0]);
        }
        else
            bullish_signal = false;
    }
    else if(type === 'bearish') {
        if(data_[data_.length - 2].close > data_[data_.length - 2].open
            && sma_last[sma_last.length - 2] - sma_last[sma_last.length - 1] > 0.45
        ) {
            // console.log('resistance');
            bearish_signal = true;
            // const temp_resistance = Math.max(data_[data_.length - 2].close, data_[data_.length - 1].open);
            // temp_resistances.push([temp_resistance, 0]);
        }
        else
            bearish_signal = false;
    }
}

function testCandle() {
    // take contract
    takeContract();

    // 1. wait for 25 candles
    if(data_.length < 25) return;
    // 2. calculate support and resistance
    calculateTempSupportsAndResistances();

    
    // checkResults();
}
function watching() {
    try {
        ws.on('message', (message) => {
            const response = JSON.parse(message);            
            if (response.msg_type === 'ohlc') {
                date = new Date(response.ohlc.epoch * 1000);
                if(date.getSeconds() === 58) {
                    data_.push({"close":response.ohlc.close,"epoch":response.ohlc.epoch,"high":response.ohlc.high,"low":response.ohlc.low,"open":response.ohlc.open});
                    testCandle();
                    if(data_.length > 25)
                        data_.shift();
                }
            }
            else if(response.msg_type === 'authorize') {
                authHandler();
            }
            else if (response.msg_type === 'error') {
                console.log(response.error.message);
            } else {
                console.log({ 'unhandled response': response });
            }
        });
    } catch (err) {
        logger.error('Error in watching: ' + err.message);
    }
}

function openSocket() {
    try {
        if (ws != null) {
            socketStatus = 'already opened';
            return;
        } else {
            ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
            watching();
            ws.on('open', () => {
                console.log('Trying to authorize');
                ws.send(JSON.stringify({ authorize: apiToken }));
            });
            socketStatus = 'just Opened';
        }
    } catch (err) {
        console.log('Error in openSocket: ' + err.message);
    }
}

function startServer() {
    try {
        
        openSocket();
        server = app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('Error in startServer: ' + err.message);
    }
}

startServer();
