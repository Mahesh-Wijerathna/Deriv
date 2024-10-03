const WebSocket = require('ws');
const fs = require('fs');
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

let lastEpoch = "latest";  // Store the timestamp for the next request
let totalCandles = 0;      // Track the total number of candles fetched
const maxCandles = 1000;  // Stop after 60,000 candles
let isFetching = false;    // Prevent simultaneous fetches
let isFirstBatch = true;   // Flag to handle the first batch's comma separation

// Create a write stream to store candle data
const writeStream = fs.createWriteStream('candles_test.json');

// Initialize the file with an empty array
writeStream.write('[');

// WebSocket message handler
ws.on('message', (message) => {
    const data = JSON.parse(message);
    // console.log(data.candles);
    if (data && data.candles.length > 0) {
        totalCandles += data.candles.length;
        console.log(`Fetched ${data.candles.length} candles. Total so far: ${totalCandles}`);

        // Append candle data to the file (without the first and last commas in JSON format)
        data.candles.reverse().forEach((candle, index) => {
            if (!isFirstBatch || totalCandles > data.candles.length) {
                writeStream.write(','); // Write comma between JSON objects
            }

            writeStream.write(JSON.stringify(candle));
            isFirstBatch = false; // Set after first candle
        });

        // Check if we have fetched 60,000 candles
        if (totalCandles >= maxCandles) {
            console.log('Fetched the maximum of  candles. Stopping further requests.');
            writeStream.write(']'); // Close the JSON array
            writeStream.end();      // Close the file stream
            ws.close();             // Close the WebSocket connection
            return;
        }

        // Set the end time for the next request (get the earliest candle's epoch)
        lastEpoch = data.candles[data.candles.length-1].epoch - 1;
        
        isFetching = false; // Allow next fetch
        fetchData(lastEpoch); // Fetch the next batch
    }
});

// Function to fetch data from the WebSocket
function fetchData(endTime) {
    if (isFetching) return; // Prevent fetching if one is already in progress
    isFetching = true;
    // console.log(`Fetching candles up to ${endTime}`);
    ws.send(JSON.stringify({
        ticks_history: "R_10",
        granularity: 60, // 1-minute candles
        end: endTime,
        count: 500,    // Fetch up to 10 candles (for testing, adjust as needed)
        style: "candles"
    }));
}

// WebSocket open handler
ws.on('open', () => {
    console.log('WebSocket connection established');
    fetchData(lastEpoch);
});

