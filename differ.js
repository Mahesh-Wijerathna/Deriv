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



function getWatchTime(){
    if(date)
        lastWatchedTime = `${date.getHours()} : ${date.getMinutes()} : ${date.getSeconds()} `
    else
        lastWatchedTime = 'Still NULL'
}
function takeContract (){
    ws.send(JSON.stringify({
        buy: 1,
        price: 1,  // Maximum amount you're willing to stake
        parameters: {
            contract_type: 'DIGITDIFF',  // Last Digit Differ contract
            symbol: 'R_10',              // Asset: Volatility Index 10
            duration: 1,                 // Duration in ticks (5 ticks in this case)
            duration_unit: 't',           // Duration in ticks
            basis: 'stake',               // Stake-based trade
            amount: 0.5,                    // Stake amount (1 USD in this case)
            barrier: `${data[data.length-1]}`, // You are predicting that the last digit of the tick will differ from 5
            currency: 'USD'               // Trading in USD
        }
    }));
}
function checking(){    
    if(signal && used <= 3){
        if(data[data.length-0] == data[data.length-1]
        && data[data.length-1] == data[data.length-2])
        {
            takeContract();   
            signal = false;  
            data = [-1,-2,-3,-4,-5];  
            used++;
            logger.warn('contract taken');    
        }
    }
    else if(data[data.length-0] == data[data.length-1]
    && data[data.length-1] == data[data.length-2] 
    && data[data.length-2] == data[data.length-3]){
        signal = true;
        data = [-1,-2,-3,-4,-5]; 
        used = 0;
        logger.warn('Signal detected');
    }

}

// routes
app.get('/error', (req, res) => { fs.readFile('logs/error.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/warn', (req, res) => { fs.readFile('logs/warn.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/info', (req, res) => { fs.readFile('logs/info.log', 'utf8', (err, data) => {res.type('text/plain');res.send(data); });});
app.get('/restart',(req,res)=>{restartServer();res.send({"server Status" : 'restarted' }) });
app.get('/close',(req,res)=>{closeSocket();res.send({"socket Status" : 'closed' }) });
app.get('/open',(req,res)=>{openSocket();res.send({"socket Status" : socketStatus }) });
app.get('/test',(req,res)=>{res.send({'max':max})});
app.get('/',(req,res)=>{getWatchTime(); res.send({'last time data : ':{'time':lastWatchedTime,'data':data}})});
// server 
function restartServer(){
    stopServer();
    startServer();
    logger.warn('server restarting ...');
}
function stopServer(){
    clearLogFile();
    server.close();
}
function clearLogFile() {  
    try {
        fs.writeFileSync('logs/info.log', '');
        fs.writeFileSync('logs/warn.log', '');
        fs.writeFileSync('logs/error.log', '');
        logger.error('log files cleared');
    }
    catch (err) {
        logger.error(err);
    }
}
function closeSocket(){
    if(ws != null){
        ws.close();
        ws = null;
        socketStatus = 'closed';
    }
    else{
        socketStatus = 'already closed';
    }
}
function watching(){
    ws.on('message', (message) => {
        const response = JSON.parse(message);
        if (response.msg_type === 'tick') {
            const tick = response.tick;
            const value = parseInt(parseFloat(tick.quote)*1000);
            data.push(value);
            checking();
            logger.info({'value':parseFloat(tick.quote),'last : ':value%10});
        }
        else if(response.msg_type === 'authorize') {
            logger.info('Authorization was successful');
            ws.send(JSON.stringify({
                ticks: 'R_10',  
                subscribe: 1   
            }));        
            logger.warn('Subscribing ticks'); 
        }
        else if (response.msg_type === 'proposal_open_contract') {
            const contract = response.proposal_open_contract;
            if (contract.is_sold === 1) {
                if (contract.profit > 0) {
                    console.log(`You won! Profit: ${contract.profit}`);
                } else {
                    console.log(`You lost. Loss: ${contract.profit}`);
                }
            }
        }
        else if(response.msg_type === 'error') {
            logger.error(response.error.message);
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
    server = app.listen(PORT, () => {        
        logger.warn(`server started`);  
    });
};
startServer();
