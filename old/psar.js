let prices = [
    //6772.074
    [6767.902, 6768.468, 6767.902, 6768.929], // 6771.991
    [6768.551, 6765.495, 6765.495, 6768.551], //6771.731
    [6765.548, 6765.42, 6765.128, 6766.272],  //6771.335
    [6765.55, 6764.828, 6764.274, 6765.55],   //6770.770
    [6764.948, 6765.934, 6764.948, 6766.006], //6770.250
    [6765.766, 6764.384, 6764.373, 6765.835], //6769.772
    [6764.284, 6764.376, 6763.444, 6764.696], //6769.139
    [6764.361, 6766.077, 6764.361, 6766.116], //6768.570
    [6766.237, 6766.002, 6765.453, 6766.32],  //6768.057
    [6766.118, 6766.143, 6765.589, 6766.723], //6767.596
    [6766.457, 6766.107, 6765.653, 6767.016], //6767.181
    [6765.953, 6766.916, 6765.712, 6766.918], //6763.444
    // [6766.919, 6766.314, 6767.465, 6766.311]  //6773.524
];

function calculatePSAR() {
    let PSAR = 6772.074; // Start with the actual PSAR value
    let AF = 0.0;       // Initial AF value
    let EP = null;       // Initial Extreme Point (set to null for now)
    let trend = 'down';  // Start with downtrend
    const afMax = 0.2;   // Max acceleration factor

    for (let i = 0; i < prices.length; i++) {
        let high = prices[i][3];  // Current high
        let low = prices[i][2];   // Current low

        // Update based on trend direction
        if (trend === 'down') {
            if (EP === null || low < EP) {
                EP = low;           // Update EP (lowest low in downtrend)
                AF = Math.min(AF + 0.02, afMax);  // Increment AF, cap at 0.2
            }
            if (PSAR < low) {
                // Trend reversal to up
                trend = 'up';
                PSAR = EP;          // Set PSAR to previous EP (lowest low)
                EP = high;          // Reset EP to current high
                AF = 0.02;          // Reset AF
            }
        } else if (trend === 'up') {
            if (EP === null || high > EP) {
                EP = high;           // Update EP (highest high in uptrend)
                AF = Math.min(AF + 0.02, afMax);  // Increment AF, cap at 0.2
            }
            if (PSAR > high) {
                // Trend reversal to down
                trend = 'down';
                PSAR = EP;          // Set PSAR to previous EP (highest high)
                EP = low;           // Reset EP to current low
                AF = 0.02;          // Reset AF
            }
        }

        // Output the current PSAR, EP, and AF values for each price point
        console.log(`Price: ${prices[i]}, Trend: ${trend}, EP: ${EP}, PSAR: ${PSAR}, AF: ${AF}`);

        // Update the PSAR value for the next period
        PSAR = PSAR + AF * (EP - PSAR);

        // Log the calculated PSAR for this step
        console.log(`Updated PSAR: ${PSAR}`);
    }
}

calculatePSAR();
