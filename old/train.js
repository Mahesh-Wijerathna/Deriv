const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const {MACD, EMA, CrossUp, CrossDown, PSAR } = require('technicalindicators');
const logger = require('../logger.js');

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

function checking() {
    try {
        if (data.length < 55)
            return;
        const closePrices = data.map(x => x[1]);
        const ema50 = EMA.calculate({ period: 50, values: closePrices });
        if(ema50[ema50.length - 1] > ema50[ema50.length - 2] ){
            for (let i = -1; i >= -10; i--) 
                if (!(closePrices[closePrices.length + i] > ema50[ema50.length + i])) 
                    return;
            const MACDInput = {
                values: closePrices,
                fastPeriod: 12,  // Typically 12
                slowPeriod: 26,  // Typically 26
                signalPeriod: 9, // Typically 9
                SimpleMAOscillator: false, // Use EMA instead of SMA
                SimpleMASignal: false      // Use EMA instead of SMA
            };
            const macdResult = MACD.calculate(MACDInput);
            const macdLine = macdResult.map(item => item.MACD);
            const signalLine = macdResult.map(item => item.signal);
            const macdCrossUp = CrossUp.calculate({ lineA: macdLine, lineB: signalLine });
            if (macdCrossUp[macdCrossUp.length - 1]) 
                bullishSignal = 1;
            
        }
        else if(ema50[ema50.length - 1] < ema50[ema50.length - 2]){ 
            for (let i = -1; i >= -10; i--) 
                if (!(closePrices[closePrices.length + i] < ema50[ema50.length + i])) 
                    return;
            const MACDInput = {
                values: closePrices,
                fastPeriod: 12,  // Typically 12
                slowPeriod: 26,  // Typically 26
                signalPeriod: 9, // Typically 9
                SimpleMAOscillator: false, // Use EMA instead of SMA
                SimpleMASignal: false      // Use EMA instead of SMA
            };
            const macdResult = MACD.calculate(MACDInput);
            const macdLine = macdResult.map(item => item.MACD);
            const signalLine = macdResult.map(item => item.signal);
            const macdCrossDown = CrossDown.calculate({ lineA: macdLine, lineB: signalLine });
            if (macdCrossDown[macdCrossDown.length - 1]) 
                bearishSignal = 1;
        }
        if (data.length > 60) {
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
function calculatePSAR(prices,  step = 0.02, maxAF = 0.2) {
    
    console.log('Step: ' + step);
    console.log('Max AF: ' + maxAF);

    let AF = step;  // Acceleration Factor
    let isUptrend = true;  // Assume uptrend at the start
    let EP = prices[0].high;  // Extreme Point, assuming low to start
    let psar = 6764.051;  // Start with your custom initial PSAR
  
    for (let i = 0; i < prices.length; i++) {
        console.log(prices);
        console.log('data' + i + ': ' + prices[i].low + ' ' + prices[i].high);
      if (isUptrend) {
        // Uptrend calculations
        console.log('EP: ' + EP);
        psar = psar + AF * (EP - psar);
        if (prices[i].low < psar) {  // Switch to downtrend
          isUptrend = false;
          AF = step;  // Reset acceleration factor
          EP = prices[i].high;
        } else {
          if (prices[i].high > EP) {
            EP = prices[i].high;
            AF = Math.min(AF + step, maxAF);  // Increase AF but cap at maxAF
          }
        }
      } else {
        // Downtrend calculations
        psar = psar + AF * (EP - psar);
        if (prices[i].high > psar) {  // Switch to uptrend
          isUptrend = true;
          AF = step;
          EP = prices[i].low;
        } else {
          if (prices[i].low < EP) {
            EP = prices[i].low;
            AF = Math.min(AF + step, maxAF);
          }
        }
      }
      console.log(`PSAR for period ${i}: ${psar}`);
    }
  }

function watching() {
    try {
        ws.on('message', (message) => {
            const response = JSON.parse(message);
            if (response.msg_type === 'ohlc') {
                date = new Date(response.ohlc.epoch* 1000);
                if(date.getSeconds() === 0) {
                    if(bullishSignal > 0)
                        bullishTrade();
                    else if(bearishSignal > 0)
                        BearishTrade();
                    bullishSignal = 0;
                    bearishSignal = 0;                    
                }
                else if(date.getSeconds() === 58) {
                    data.push([
                        Number(response.ohlc.open),
                        Number(response.ohlc.close),
                        Number(response.ohlc.low),
                        Number(response.ohlc.high)
                    ]);
                    checking();    
                    logger.info({"bullishSignal": bullishSignal, "bearishSignal": bearishSignal}); 
                }                         
            
            }
            else if(response.msg_type === 'authorize') {
                ws.send(JSON.stringify({
                    ticks_history: 'R_10', 
                    adjust_start_time: 1,
                    count: 1,
                    end: 'latest',
                    start: 1,
                    style: 'candles',
                    granularity: 60 
                }));
                logger.warn('Requesting 20 candles');
                
                // ws.send(JSON.stringify({
                //     ticks_history: 'R_100',
                //     adjust_start_time: 1,
                //     count: 1,
                //     end: 'latest',
                //     start: 1,
                //     style: 'candles',
                //     granularity: 60, 
                //     subscribe: 1
                // })); 
                // logger.warn('Subscribing to 1-minute candles');         
            }
            else if (response.msg_type === 'candles') {
                data.length = 0; 
                response.candles.slice(0,-1).forEach(candle => {                
                    data.push([candle.open, candle.close, candle.low, candle.high]);
                });
                console.log(data);
                
                
                
                //calculatePSAR(response.candles.slice(0,-1),  0.02, 0.2);
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
            logger.warn(`Server started on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Error in startServer: ' + err.message);
    }
}

startServer();
