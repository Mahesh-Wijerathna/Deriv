const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const winston = require('winston');
const logger = require('./logger.js');

const PORT = 4000;
const app = express();
const apiToken = 'l7LLGTxAT6qn9v9';

let used = 0;
let max = 3;
let ws = null;
let date = null;
let signal = false;
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

function checking() {
    try {
        if (used < 1) {
            if (data[data.length - 1] == data[data.length - 2]
            &&  data[data.length - 2] == data[data.length - 3]
            ) {
                takeContract();
                signal = false;
                data = [-1, -2, -3, -4, -5];
                used++;
                logger.warn('Contract taken');
            }
        } else if (data[data.length - 1] == data[data.length - 2] 
                && data[data.length - 2] == data[data.length - 3]
                && data[data.length - 3] == data[data.length - 4]
            ) {
            
            data = [-1, -2, -3, -4, -5];
            used = 0;
            logger.warn('Signal detected');
        }
        if (data.length > 5) {
            data.shift();
        }
    } catch (err) {
        logger.error('Error in checking: ' + err.message);
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

function watching() {
    try {
        ws.on('message', (message) => {
            const response = JSON.parse(message);
            if (response.msg_type === 'tick') {
                const tick = response.tick;
                const value = parseInt(parseFloat(tick.quote) * 1000);
                data.push(value % 10);
                // logger.info({ 'value': parseFloat(tick.quote), 'data': data });
                checking();
                date = new Date(response.tick.epoch * 1000);
            } else if (response.msg_type === 'authorize') {
                logger.info('Authorization was successful');
                ws.send(JSON.stringify({
                    ticks: 'R_10',
                    subscribe: 1
                }));
                logger.warn('Subscribing ticks');
            } else if (response.msg_type === 'proposal_open_contract') {
                const contract = response.proposal_open_contract;
                if (contract.is_sold === 1) {
                    if (contract.profit > 0) {
                        console.log(`You won! Profit: ${contract.profit}`);
                    } else {
                        console.log(`You lost. Loss: ${contract.profit}`);
                    }
                }
            } else if (response.msg_type === 'error') {
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
            logger.warn(`Server started on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Error in startServer: ' + err.message);
    }
}

startServer();
