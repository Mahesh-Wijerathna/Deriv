const WebSocket = require('ws');
const apiToken = 'l7LLGTxAT6qn9v9';
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

const data = [];








const bearishEngulf = () => {
    if (data.length < 2) return 0;
    const [currentCandle, previousCandle] = [data[data.length-1], data[data.length-2]];
    const isBearishEngulfing = (
        previousCandle[0] < previousCandle[1] && // previous candle is bullish
        currentCandle[1] < previousCandle[0] && // Close of current < Open of previous
        currentCandle[0] > previousCandle[1]    // Open of current > Close of previous
    );
    if (!isBearishEngulfing) return 0;
    console.log("Bearish Engulfing Pattern Detected:", currentCandle, previousCandle);
    return 1;
};


const buy = () => {
    ws.send(JSON.stringify({
        buy: 1,
        price: 1, // Buy at 4 USD
        parameters: {
            contract_type: 'ONETOUCH',  // You're buying a CALL contract
            duration: 2,            // Duration is 2 minutes
            duration_unit: 'm',      // Duration unit is minutes
            symbol: 'R_100',         // Volatility 100 Index
            currency: 'USD',         // USD as currency
            basis: 'stake',          // 'stake' means you're risking 5 USD,
            barrier: '+0.34',
            amount: 0.5,              // Amount to stake

        
        }
    }));
}




let start = 0;
let low = 0;
let high = 0;
let signals = false;
const watching = (currentPrice,epochTime) => { 
    buy();
    console.log("watching");   
    const date = new Date(epochTime);
    const seconds = date.getSeconds();
    console.log(seconds);
    console.log(data);
    if (seconds == 0) {
        
        if(signals){
            buy();
            signals = false;            
        }
        low = high = start = currentPrice;
    }
    low = Math.min(low, currentPrice);
    high = Math.max(high, currentPrice);
    if(seconds == 58){
        data.push([start,currentPrice,low,high]);
        if(data.length > 2)
            data.shift();
        if(bearishEngulf() >0 )
            signals = true ;         
    }    
};






    







ws.on('message', (message) => {
    const response = JSON.parse(message); 

    if (response.msg_type === 'tick') {   
        watching(response.tick.quote, response.tick.epoch*1000);
    }
    if (response.msg_type === 'authorize' && response.authorize) {
        console.log("Authorization successful!");
        ws.send(JSON.stringify({
            ticks: 'R_100',  
            subscribe: 1     
        }));
    }
    if (response.error) {
        console.error('Error:', response.error.message);
    } 
    if (response.msg_type === 'proposal') {
        console.log('Proposal Details:', response.proposal);
    } 
    if (response.msg_type === 'buy') {
        console.log('Buy Response:', response);
    }
    // else {
    //     console.log('Unhandled response:', response);
    // }
});

ws.on('open', () => {
    ws.send(JSON.stringify({ authorize: apiToken }));
});
ws.on('error', (error) => {
    console.error("WebSocket Error:", error);
});
