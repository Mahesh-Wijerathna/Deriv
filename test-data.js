const fs = require('fs');
const { simpleMovingAverage, parabolicSAR } = require('./indicators.js');

let total = 0;
let won_count  = 0;
let lost_count = 0;
let data_ = [];
let signal = null;
fs.readFile('candles_test.json', 'utf8', (err, data) => {
    if (err) throw err;

    // Parse the JSON data
    const candles = JSON.parse(data);

    // Process each candle one by one
    candles.reverse().forEach((candle, index) => {
        // console.log(`Processing candle #${index + 1}:`, candle);
        total ++;
        data_.push(candle);
        testCandle();
        if(data_.length > 25)
            data_.shift();
    });
    console.log('Total candles:', total);
    console.log('Won:', won_count);
    console.log('Lost:', lost_count);
    // console.log('Supports:', temp_supports);
    // console.log('Resistances:', temp_resistances);
    // console.log('candle data:', data_.map(candle => new Date(candle.epoch * 1000).toLocaleString()));
});
//************************************************************************************* */

let bullish_signal = false;
let bearish_signal = false;
function takeContract() {
    if(bullish_signal) {
        contracts.push([data_[data_.length - 1].open,'bullish', 1 , data_[data_.length - 1].epoch]);
    } else if(bearish_signal) {
        contracts.push([data_[data_.length - 1].open,'bearish', 1 , data_[data_.length - 1].epoch]);
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
            else if(data_[data_.length - 1].high - contract[0] > 0.2) {
                won_count++;
                contract[1] = 'won';
                // console.log(new Date(contract[3] * 1000 - 19800000 ).toLocaleString());
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
                // console.log('lost' + new Date(contract[3] * 1000 - 19800000 ).toLocaleString());
                contracts.splice(index, 1);
            }
            else if(contract[0] - data_[data_.length - 1].low > 0.2) {
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
            && sma_last[sma_last.length - 2] - sma_last[sma_last.length - 1] > -0.45
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

    
    checkResults();
}
