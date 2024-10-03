function simpleMovingAverage(data, period) {
    let simpleMovingAverages = [];
    let sum = 0;
    
    // Loop through the data array
    for (let i = 0; i < data.length; i++) {
        sum += data[i];
        
        // Start calculating the moving average once we have enough data points
        if (i >= period - 1) {
            simpleMovingAverages.push(sum / period); // Calculate the average
            sum -= data[i - (period - 1)]; // Subtract the first element of the current window
        }
    }
    
    return simpleMovingAverages;
}

function parabolicSAR(trend, psar, EP, AF, lastCandle) {
    if (EP === 0) {
        console.log('Setting initial EP');
        console.log('psar = ' + psar);
        console.log('EP = ' + EP);
        psar = lastCandle.high; 
        EP = lastCandle.low;   
        trend = 'down';       
    }    

    if (trend === 'down') { 

        // Ensure PSAR doesn't go above the high of the last candle
        // if (psar > lastCandle[3]) psar = lastCandle[3];

        // If the high of the current candle crosses above the PSAR, reverse the trend to upward
        if (lastCandle[3] > psar) {  // High price is greater than PSAR
            trend = 'up';
            psar = EP;               // PSAR resets to the extreme point (low)
            EP = lastCandle[3];      // New EP is the high of the current candle
            AF = 0.02;             // Reset acceleration factor
            console.log('Switching to uptrend');
            console.log('lastCandle = ' + lastCandle);
            
        } else {
            // Continue the downward trend: update EP if there's a new lower low
            if (lastCandle[2] < EP) {
                EP = lastCandle[2];   // Update EP to the new low
                AF = Math.min(AF + 0.02, 0.2); // Increase AF, max 0.2
            }
        }
    }
    else if (trend === 'up') {  // PSAR calculation for uptrend

        // Ensure PSAR doesn't go below the low of the last candle
        // if (psar < lastCandle[2]) psar = lastCandle[2];

        // If the low of the current candle crosses below the PSAR, reverse the trend to downward
        if (lastCandle[2] < psar) {  // Low price is less than PSAR
            trend = 'down';
            psar = EP;               // PSAR resets to the extreme point (high)
            EP = lastCandle[2];      // New EP is the low of the current candle
            AF = 0.02;   
            console.log('Switching to downtrend');  
            console.log('lastCandle = ' + lastCandle);
        } else {
            // Continue the upward trend: update EP if there's a new higher high
            if (lastCandle[3] > EP) {
                EP = lastCandle[3];   // Update EP to the new high
                AF = Math.min(AF + 0.02, 0.2); // Increase AF, max 0.2
            }
        }
        
    }
    psar = psar + AF * (EP - psar);  // PSAR calculation for uptrend

    return [trend, psar, EP, AF];
}


// Export the function
module.exports = {
    simpleMovingAverage,
    parabolicSAR
};
