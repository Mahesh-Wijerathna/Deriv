const tf = require('@tensorflow/tfjs-node');  // Use tfjs-node for improved performance
const WebSocket = require('ws');
const fs = require('fs');
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
const apiToken = 'l7LLGTxAT6qn9v9';

let last100 = [];
let next10 = [];
let model = null;
let minClosePrice, maxClosePrice;

function takeData(c) {
    ws.send(JSON.stringify({
        ticks_history: 'R_100',
        adjust_start_time: 1,
        count: c,
        end: 'latest',
        start: 1,
        style: 'candles',
        granularity: 60
    }));
}

function normalizeData(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return {
        normalized: data.map(d => (d - min) / (max - min)),
        min, max
    };
}

function createSequences(data, windowSize) {
    let sequences = [];
    for (let i = 0; i <= data.length - windowSize; i++) {
        sequences.push(data.slice(i, i + windowSize));
    }
    return sequences;
}

function createLSTMModel(windowSize) {
    const model = tf.sequential();
    model.add(tf.layers.lstm({
        units: 10,
        returnSequences: false,
        inputShape: [windowSize, 1]
    }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
    });
    return model;
}

async function saveModelToFile(model, path) {
    await model.save(`file://${path}`);  // Save model to file using TensorFlow.js node backend
}

async function loadModelFromFile(path) {
    const model = await tf.loadLayersModel(`file://${path}/model.json`);
    return model;
}

async function trainModel() {
    if (last100.length < 100) return;

    const { normalized: normalizedData, min, max } = normalizeData(last100);
    minClosePrice = min;
    maxClosePrice = max;

    const sequences = createSequences(normalizedData, 10);
    const inputs = sequences.slice(0, -1);
    const outputs = normalizedData.slice(10, normalizedData.length);

    const xs = tf.tensor3d(inputs.map(seq => seq.map(d => [d])), [inputs.length, 10, 1]);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    const model = createLSTMModel(10);
    await model.fit(xs, ys, {
        batchSize: 16,
        epochs: 20,
        shuffle: false
    });

    await saveModelToFile(model, './model');

    return { model, min, max };
}

function testData(model, min, max) {
    if (next10.length < 10) return;

    const normalizedNext10 = normalizeData(next10).normalized;
    const input = tf.tensor3d([normalizedNext10.map(d => [d])], [1, 10, 1]);

    const prediction = model.predict(input);
    const nextClosePrice = prediction.dataSync()[0];
    const realPrice = nextClosePrice * (max - min) + min;

    console.log('Predicted next close price:', realPrice);
    return realPrice;
}

ws.on('message', async (message) => {
    const response = JSON.parse(message);

    if (response.msg_type === 'candles') {
        if (response.candles.length === 10) {
            next10 = response.candles.map(candle => candle.close);
            const model = await loadModelFromFile('./model');
            testData(model, minClosePrice, maxClosePrice);
        } else if (response.candles.length === 100) {
            last100 = response.candles.map(candle => candle.close);
            const { model: trainedModel, min, max } = await trainModel();
            takeData(10);
        }
    } else if (response.msg_type === 'authorize') {
        takeData(100);
    }
});

ws.on('open', () => {
    ws.send(JSON.stringify({ authorize: apiToken }));
});
