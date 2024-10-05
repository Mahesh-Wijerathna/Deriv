const fs = require('fs');
const  { simpleMovingAverage } = require('./../indicators.js');
let won_count = 0;
let lost_count = 301;
let total = 0;
let data = [];
let ratio = 1;
let wonLossRatio = 0; 
let current_ratio = 1;
let current_sma_limit = 0;
let sma_last = 0;
fs.readFile('candles_data.json', 'utf8', (err, data_) => {
    if (err) throw err;
    const candles = JSON.parse(data_).reverse();   
    
    while(current_sma_limit < 3){
        current_sma_limit += 0.1;   
        current_ratio = 1;     
        while(won_count + lost_count > 300){
            current_ratio += 0.1;            
            won_count = lost_count = 0;
            contracts.length = 0;
            data.length=0;
            candles.forEach((candle, index) => {
                total ++;
                data.push(candle);
                testCandle();
                // if(won_count/lost_count < 5){
                //     console.log('Won:', won_count);
                //     console.log('Lost:', lost_count);
                //     console.log('Total candles:', total);                    
                // }
                if(data.length > 25)
                    data.shift();
            });
            
            console.log(won_count,lost_count);
            console.log('Optimizing ...', current_sma_limit);
            console.log('WonLossRatio', won_count/lost_count);
            // if(current_ratio > 3) 
                break;
        }
        console.log('Optimizing ...', sma_last,ratio);
        break;
    }
    console.log('optimized parameters : ', total);
    console.log('\tLowest SMA  ',sma_last,'\n\tWon Loss Ratio',wonLossRatio, '\n\tRatio', ratio);
});
//************************************************************************************* */

function testCandle(){
    takeContract();
    if(data.length < 2) return;
    let type = null;
    bullish_signal = false;
    bearish_signal = false;
    if(data[data.length - 1].close > data[data.length - 1].open) {
        type = 'bullish';
    } else {
        type = 'bearish';
    }
    const sma_last = simpleMovingAverage(data.map(candle => candle.close), 20);
    if(type === 'bullish') {
        if(data[data.length - 2].close < data[data.length - 2].open) {
            if((data[data.length-1].close - data[data.length-1].open)/(data[data.length-2].open - data[data.length-2].close) > 2)
                if(sma_last[sma_last.length - 1] - sma_last[sma_last.length - 2] > 0.3)
                    bullish_signal = true;             
        }        
    }
    else if(type === 'bearish') {
        if(data[data.length - 2].close > data[data.length - 2].open) {
            if((data[data.length-1].close - data[data.length-1].open)/(data[data.length-2].open - data[data.length-2].close) > 2)
                if(sma_last[sma_last.length - 2] - sma_last[sma_last.length - 1] > 0.3)
                    bearish_signal = true;
        }
    }    
    checkResults();
}


let bullish_signal = false;
let bearish_signal = false;
function takeContract() {
    if(bullish_signal) {
        contracts.push([data[data.length - 1].open,'bullish', 1 , data[data.length - 1].epoch]);
    } else if(bearish_signal) {
        contracts.push([data[data.length - 1].open,'bearish', 1 , data[data.length - 1].epoch]);
    }
}

let contracts = [];
function checkResults (){
    if(contracts.length === 0) return;
    contracts.forEach((contract, index) => {
        if(contract[1] === 'bullish') {
            if(contract[2] > 2){
                lost_count++;
                contract[1] = 'lost';
                contracts.splice(index, 1);
            }
            else if(data[data.length - 1].high - contract[0] > 0.2) {
                won_count++;
                contract[1] = 'won';                
                contracts.splice(index, 1);
            }
            else {
                contract[2]++;
            }

        }
        else if(contract[1] === 'bearish') {
            if(contract[2] > 2){
                lost_count++;
                contract[1] = 'lost';
                contracts.splice(index, 1);
            }
            else if(contract[0] - data[data.length - 1].low > 0.2) {
                won_count++;
                contract[1] = 'won';
                contracts.splice(index, 1);
            }
            else {
                contract[2]++;
            }
        }   
    });     
    
}