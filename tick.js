const WebSocket = require('ws');
const express = require('express');
const fs = require('fs').promises;
const winston = require('winston');
const { MACD, EMA, SMA, bullish } = require('technicalindicators');
const logger = require('./logger.js');

const PORT = 4000;
const app = express();
const apiToken = 'l7LLGTxAT6qn9v9';

let isOngoing = false;
let contractId = null;
let smaLevel = 0;
let max = 3;
let ws = null;
let date = null;
let bullishSignal = false;
let bearishSignal = false;
let data = [];
let lastWatchedTime = null;
let socketStatus = 'closed';

// Get the last watched time formatted
function getWatchTime() {
    lastWatchedTime = date ? `${date.getHours()} : ${date.getMinutes()} : ${date.getSeconds()}` : 'Still NULL';
}

// Send contracts based on signals
function takeContract() {
    const contracts = [
        {
            buy: 1,
            price: 1,
            parameters: {
                amount: 0.35,
                basis: 'stake',
                contract_type: bullishSignal ? 'PUT' : 'CALL',
                currency: 'USD',
                duration: 5,
                duration_unit: 't',
                symbol: 'R_10',
                barrier: bullishSignal ? '-0.18' : '+0.18'
            }
        },
        {
            buy: 1,
            price: 1,
            parameters: {
                amount: 0.65,
                basis: 'stake',
                contract_type: bullishSignal ? 'CALL' : 'PUT',
                currency: 'USD',
                duration: 5,
                duration_unit: 't',
                symbol: 'R_10',
                barrier: bullishSignal ? '-0.1' : '+0.1'
            }
        }
    ];

    if (bullishSignal || bearishSignal) {
        logger.info(bullishSignal ? 'bullish signal' : 'bearish signal');
        contracts.forEach(contract => ws.send(JSON.stringify(contract)));
        isOngoing = true;
        bullishSignal = bearishSignal = false;
    }
}

// Perform checks on data
function checking() {
    if (data.length < 42) return;

    const macdInput = { values: data, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false };
    const macdOutput = MACD.calculate(macdInput);
    const sma = SMA.calculate({ period: 20, values: data.slice(-21) });

    const histogramDelta = macdOutput[macdOutput.length - 2].histogram - macdOutput[macdOutput.length - 1].histogram;

    if (macdOutput[macdOutput.length - 1].histogram > 0 && macdOutput[macdOutput.length - 2].histogram < 0 && sma[sma.length - 1] - sma[sma.length - 2] >= smaLevel && !isOngoing) {
        bullishSignal = true;
    } else if (macdOutput[macdOutput.length - 1].histogram < 0 && macdOutput[macdOutput.length - 2].histogram > 0 && sma[sma.length - 2] - sma[sma.length - 1] >= smaLevel && !isOngoing) {
        bearishSignal = true;
    }

    if (data.length > 42) data.shift();
}

// Async route handlers
app.get('/error', async (req, res) => {
    try {
        const data = await fs.readFile('logs/error.log', 'utf8');
        res.type('text/plain').send(data);
    } catch (err) {
        logger.error('Error in /error route: ' + err.message);
        res.status(500).send('Error reading error log');
    }
});

app.get('/warn', async (req, res) => {
    try {
        const data = await fs.readFile('logs/warn.log', 'utf8');
        res.type('text/plain').send(data);
    } catch (err) {
        logger.error('Error in /warn route: ' + err.message);
        res.status(500).send('Error reading warn log');
    }
});

app.get('/info', async (req, res) => {
    try {
        const data = await fs.readFile('logs/info.log', 'utf8');
        res.type('text/plain').send(data);
    } catch (err) {
        logger.error('Error in /info route: ' + err.message);
        res.status(500).send('Error reading info log');
    }
});

app.get('/restart', (req, res) => {
    try {
        restartServer();
        res.send({ "server Status": 'restarted' });
    } catch (err) {
        logger.error('Error in /restart route: ' + err.message);
        res.status(500).send('Error restarting server');
    }
});

app.get('/close', (req, res) => {
    closeSocket();
    res.send({ "socket Status": socketStatus });
});

app.get('/open', (req, res) => {
    openSocket();
    res.send({ "socket Status": socketStatus });
});

app.get('/', (req, res) => {
    getWatchTime();
    res.send({ 'last time data': { 'time': lastWatchedTime, 'data': data } });
});

// WebSocket and server management functions
function openSocket() {
    if (ws) {
        socketStatus = 'already opened';
        return;
    }

    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    ws.on('open', () => {
        logger.info('Authorizing');
        ws.send(JSON.stringify({ authorize: apiToken }));
    });

    ws.on('message', (message) => {
        const response = JSON.parse(message);
        if (response.msg_type === 'tick') {
            const value = parseFloat(response.tick.quote);
            data.push(value);
            checking();
            takeContract();
            date = new Date(response.tick.epoch * 1000);
        } else if (response.msg_type === 'authorize') {
            logger.info('Authorization successful');
            ws.send(JSON.stringify({ ticks: 'R_10', subscribe: 1 }));
        } else if (response.msg_type === 'error') {
            logger.error(response.error.message);
        } else {
            logger.warn('Unhandled response', response);
            console.log(response);
        }
    });

    ws.on('close', () => {
        logger.warn('Socket closed');
        socketStatus = 'closed';
    });

    socketStatus = 'just opened';
}

function closeSocket() {
    if (ws) {
        ws.close();
        ws = null;
        socketStatus = 'closed';
    } else {
        socketStatus = 'already closed';
    }
}

function restartServer() {
    stopServer();
    startServer();
}

function stopServer() {
    closeSocket();
    server.close();
    logger.warn('Server stopped');
}

function startServer() {
    clearLogFile();
    openSocket();
    server = app.listen(PORT, () => {
        logger.warn(`Server started on port ${PORT}`);
    });
}

function clearLogFile() {
    ['info.log', 'warn.log', 'error.log'].forEach(async (file) => {
        await fs.writeFile(`logs/${file}`, '');
    });
    logger.info('Log files cleared');
}

startServer();
