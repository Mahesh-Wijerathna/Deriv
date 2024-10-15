const fs = require('fs');
const RSI = require('technicalindicators').RSI;
const { simpleMovingAverage, parabolicSAR } = require('./indicators.js');
const e = require('express');

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
        if(won_count/lost_count < 1){
            console.log('Won:', won_count);
            console.log('Lost:', lost_count);
            console.log('Total candles:', total);
        }
        if(data_.length > 2)
            data_.shift();
    });
    
    console.log('Total candles:', total);
    console.log('Won:', won_count);
    console.log('Lost:', lost_count);
    console.log('won / lost:', won_count/lost_count);
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


function checkOverSoldOverBought() {
    const inputRSI = {
        values: closePrices,
        period: 14
    };
    // Calculate RSI
    const rsiValues = RSI.calculate(inputRSI);
    if(rsiValues[rsiValues.length - 1] > 65) {
        bearish_signal = true;
    }
    else if(rsiValues[rsiValues.length - 1] < 35) {
        bullish_signal = true;
    }
    else {
        bearish_signal = false;
        bullish_signal = false;
    }
}







function testCandle() {
    const size = data_[data_.length - 1].close - data_[data_.length - 1].open;
    if(-2.31 < size && size < 2.31) {
        lost_count++;        
    }
    else
    
        won_count++;
}
