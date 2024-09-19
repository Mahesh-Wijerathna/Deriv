const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const winston = require('winston');
const logger = require('../logger.js');



const PORT = 4000;
const app = express();
const apiToken = 'l7LLGTxAT6qn9v9';


let SMA_Limits = [0,0,0,0,0];
let ws = null;
let date = null;
let bullishSignal = 0;
let signal = 0;
let bullishContractId = null;
let bearishContractId = null;
let data = [];
let lastWatchedTime = null;
let socketStatus = 'closed';
let server = null;


function getWatchTime(){
    if(date)
        lastWatchedTime = `${date.getHours()} : ${date.getMinutes()} : ${date.getSeconds()} `
    else
        lastWatchedTime = 'Still NULL'
}
function limitHandler(){
    SMA_Limits[0] =+ 0.01;
    SMA_Limits[1] = SMA_Limits[0]/5;
    SMA_Limits[2] = SMA_Limits[0]/10;
    SMA_Limits[3] = SMA_Limits[0]/15;
    SMA_Limits[4] = SMA_Limits[0]/20;

}
function sellAtMarketPrice(){
    if (contractId) {
        ws.send(JSON.stringify({
            sell: 1,
            request_id: contractId  
        }));
        console.log(`Selling contract with ID ${contractId} at market price`);
    } else {
        console.error('No contract to sell');
    }
}
function takeContract (){
    ws.send(JSON.stringify({
        buy: 1,
        price: 1, 
        parameters: {
            contract_type: 'CALL',
            duration: 2,
            duration_unit: 'm',
            symbol: 'R_10',
            currency: 'USD',
            basis: 'stake',
            barrier: '+0.09',
            amount: 0.5
        }
    }));
    ws.send(JSON.stringify({
        buy: 1,
        price: 1, 
        parameters: {
            contract_type: 'PUT',
            duration: 2,
            duration_unit: 'm',
            symbol: 'R_10',
            currency: 'USD',
            basis: 'stake',
            barrier: '-0.09',
            amount: 0.5
        }
    }));
}
function calculateAverage  (startIndex, endIndex)  {
    if (startIndex < 0 || endIndex >= data.length || startIndex > endIndex) {
        return 0;
    }
    let sum = 0;
    let count = 0;
    for (let i = startIndex; i <= endIndex; i++) {
        sum += data[i][1]; 
        count++;
    }
    return sum / count;
};
function signalSetting(){
    if(calculateAverage(data.length-5,data.length-1)-calculateAverage(data.length-6,data.length-2)>=SMA_Limits[0]){
        if(!(calculateAverage(data.length-10,data.length-1)-calculateAverage(data.length-11,data.length-2)>=SMA_Limits[1]))
            return 0;
        if(!(calculateAverage(data.length-15,data.length-1)-calculateAverage(data.length-16,data.length-2)>=SMA_Limits[2]))
            return 0;
        if(!(calculateAverage(data.length-20,data.length-1)-calculateAverage(data.length-21,data.length-2)>=SMA_Limits[3]))
            return 0;
        if(!(calculateAverage(data.length-25,data.length-1)-calculateAverage(data.length-26,data.length-2)>=SMA_Limits[4]))
            return 0;
        logger.warn('bullish patten ');
        return 1;
    }
    else if(calculateAverage(data.length-6,data.length-2)-calculateAverage(data.length-5,data.length-1)>=SMA_Limits[0]){
        if(!(calculateAverage(data.length-11,data.length-2)-calculateAverage(data.length-10,data.length-1)>=SMA_Limits[1]))
            return 0;
        if(!(calculateAverage(data.length-16,data.length-2)-calculateAverage(data.length-15,data.length-1)>=SMA_Limits[2]))
            return 0;
        if(!(calculateAverage(data.length-21,data.length-2)-calculateAverage(data.length-20,data.length-1)>=SMA_Limits[3]))
            return 0;
        if(!(calculateAverage(data.length-26,data.length-2)-calculateAverage(data.length-25,data.length-1)>=SMA_Limits[4]))
            return 0;
        logger.warn('bearish pattern ')
        return 1;
    }
    else
        return 0
}
// routes
app.get('/error', (req, res) => { fs.readFile('logs/error.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/warn', (req, res) => { fs.readFile('logs/warn.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/info', (req, res) => { fs.readFile('logs/info.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/restart',(req,res)=>{restartServer();res.send({"server Status" : 'restarted' }) });
app.get('/close',(req,res)=>{closeSocket();res.send({"socket Status" : 'closed' }) });
app.get('/open',(req,res)=>{openSocket();res.send({"socket Status" : socketStatus }) });
app.get('/',(req,res)=>{getWatchTime(); res.send({'last time data : ':{'time':lastWatchedTime,'data':data}})});
// server 
function restartServer(){

}
function stopServer(){
    clearLogFile();
}
function clearLogFile() {  
    try {
        fs.unlinkSync('logs/info.log');
        fs.unlinkSync('logs/warn.log');
        fs.unlinkSync('logs/error.log');
        logger.error('log files cleared');
    }
    catch (err) {
        logger.error(err);
    }
}
function closeSocket(){

}
function watching(){
    ws.on('message', (message) => {
        const response = JSON.parse(message);
        if (response.msg_type === 'ohlc') {
            date = new Date(response.ohlc.epoch* 1000);
            if(date.getSeconds() === 0) {
                if(signal > 0)
                    takeContract();
                
            }
            else if(date.getSeconds() === 58) {
                data.push([
                    Number(response.ohlc.open),
                    Number(response.ohlc.close),
                    Number(response.ohlc.low),
                    Number(response.ohlc.high)
                ]);
                logger.info({candle : {open: response.ohlc.open, close: response.ohlc.close, low: response.ohlc.low, high: response.ohlc.high}});
                signal = signalSetting();
                logger.info({'signal':signal});
            }
            if(data.length > 30) {
                data.shift();
            }           
        }
        else if(response.msg_type === 'authorize') {
            logger.info('Authorization was successful');
            ws.send(JSON.stringify({
                ticks_history: 'R_10', 
                adjust_start_time: 1,
                count: 30,
                end: 'latest',
                start: 1,
                style: 'candles',
                granularity: 60 
            }));
            logger.info('Requesting 30 candles');
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
        else if (response.msg_type === 'candles') {
            data.length = 0; 
            response.candles.slice(0,-1).forEach(candle => {                
                data.push([candle.open, candle.close, candle.low, candle.high]);
            });
            logger.warn({'last two candles':{'prev':data[data.length-2],'last':data[data.length-1]}})
        }
        else{
            logger.warn({'unhandled response':response});
        }
    });
}
function openSocket(){
    if(ws != null){
        socketStatus = 'already opened';
        return;
    }
    else{
        ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
        watching(); 
        ws.on('open', () => {
            logger.info('Trying to authorize');
            ws.send(JSON.stringify({ authorize: apiToken }));
        }); 
        socketStatus = 'just Opened'       
    }
}
function startServer  () {   
    clearLogFile(); 
    server = app.listen(PORT, () => {        
        logger.warn(`server started`);  
    });
};
startServer();
