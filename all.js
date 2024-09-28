const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const winston = require('winston');
const logger = require('./logger.js');
const { simpleMovingAverage, parabolicSAR } = require('./indicators.js');

const PORT = 4000;
const app = express();
const apiToken = 'l7LLGTxAT6qn9v9';

let used = 0;
let max = 3;
let ws = null;
let date = null;
let bullishSignal = 0;
let bearishSignal = 0;
let data = [];
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

function takeContract() {
    try {
        ws.send(JSON.stringify({
            buy: 1,
            price: 1,
            parameters: {
                contract_type: 'DIGITDIFF',
                symbol: 'R_10',
                duration: 1,
                duration_unit: 't',
                basis: 'stake',
                amount: 0.5,
                barrier: `${data[data.length - 1]}`,
                currency: 'USD'
            }
        }));
    } catch (err) {
        logger.error('Error in takeContract: ' + err.message);
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
        res.send({ 'last time data': { 'time': lastWatchedTime, 'data': data } });
    } catch (err) {
        logger.error('Error in / route: ' + err.message);
    }
});

// Server functions
function restartServer() {
    try {
        stopServer();
        startServer();
        logger.warn('Server restarting...');
    } catch (err) {
        logger.error('Error in restartServer: ' + err.message);
    }
}

function stopServer() {
    try {
        closeSocket();
        server.close();
    } catch (err) {
        logger.error('Error in stopServer: ' + err.message);
    }
}

function clearLogFile() {
    try {
        fs.writeFileSync('logs/info.log', '');
        fs.writeFileSync('logs/warn.log', '');
        fs.writeFileSync('logs/error.log', '');
        logger.error('Log files cleared');
    } catch (err) {
        logger.error('Error in clearLogFile: ' + err.message);
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
    logger.warn('Authorized');
    ws.send(JSON.stringify({
        ticks_history: 'R_10', 
        adjust_start_time: 1,
        count: 25,
        end: 'latest',
        start: 1,
        style: 'candles',
        granularity: 60 
    }));
    logger.warn('Requesting 20 candles');
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
    logger.warn('Subscribing to 1-minute candles');  
}
let psar = 0;
let trend = 'down';
let EP = 0;
let AF = 0.02;
function checking() {
    try {
        
        if (data.length < 25)
            return;
        

        const psarData = parabolicSAR(trend,psar,EP,AF,data[data.length - 1]);
        psar = psarData[1];
        EP = psarData[2];
        AF = psarData[3];
        trend = psarData[0];  

        if (data.length > 25) {
            data.shift();
        }
    } catch (err) {
        logger.error('Error in checking: ' + err.message);
    }
}
function ohlcHandler(response){
    date = new Date(response.ohlc.epoch* 1000);    
    if(date.getSeconds() === 59) {
        data.push([
            Number(response.ohlc.open),
            Number(response.ohlc.close),
            Number(response.ohlc.low),
            Number(response.ohlc.high)
        ]);
        checking(); 
    } 
    if(trend == 'up' && Number(response.ohlc.low) < psar) {
        logger.warn('Bearish Signal');
        ws.send(JSON.stringify({
        buy: 1,
        price: 1,
        parameters: {
            contract_type: 'ONETOUCH',
            symbol: 'R_10',
            duration: 5,
            duration_unit: 'm',
            basis: 'stake',
            amount: 0.5,
            barrier: `-0.08`,
            currency: 'USD'
        }
        }));
        trend = 'down';

        
    }
    else if(trend == 'down' && Number(response.ohlc.high) > psar) {
        logger.warn('Bullish Signal');
        ws.send(JSON.stringify({
        buy: 1,
        price: 1,
        parameters: {
            contract_type: 'ONETOUCH',
            symbol: 'R_10',
            duration: 5,
            duration_unit: 'm',
            basis: 'stake',
            amount: 0.5,
            barrier: `+0.08`,
            currency: 'USD'
        }
        }));
        trend = 'up';
    }
            
}
function watching() {
    try {
        ws.on('message', (message) => {
            const response = JSON.parse(message);
            if (response.msg_type === 'ohlc') 
                ohlcHandler(response);
            else if(response.msg_type === 'authorize') {
                authHandler();
            }
            else if (response.msg_type === 'candles') {
                data.length = 0; 
                response.candles.slice(0,-1).forEach(candle => {                
                    data.push([candle.open, candle.close, candle.low, candle.high]);
                    const psarData = parabolicSAR(trend,psar,EP,AF,data[data.length - 1]);
                    psar = psarData[1];
                    EP = psarData[2];
                    AF = psarData[3];
                    trend = psarData[0];                       
                    
                });
                // console.log(psar);

            }             
            else if (response.msg_type === 'error') {
                logger.error(response.error.message);
            } else {
                logger.warn({ 'unhandled response': response });
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
                logger.info('Trying to authorize');
                ws.send(JSON.stringify({ authorize: apiToken }));
            });
            socketStatus = 'just Opened';
        }
    } catch (err) {
        logger.error('Error in openSocket: ' + err.message);
    }
}

function startServer() {
    try {
        clearLogFile();
        openSocket();
        server = app.listen(PORT, () => {
            logger.warn(`http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('Error in startServer: ' + err.message);
    }
}

startServer();
