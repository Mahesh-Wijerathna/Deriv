let intervalId = null;
let previousValue = null;
let currentVale = null;
let isWatching = false;
let firstCondition = false;
let value10 = null;
let value20 = null;
let value50 = null;

class Queue {
    constructor(cap) {
        this.queue = [];
        this.capacity = cap;
    }

    enqueue(item) {
        if (this.queue.length < this.capacity) {
            this.queue.push(item);
            return `Enqueued: ${item}`;
        } else {
            return "Queue is full. Cannot enqueue.";
        }
    }

    dequeue() {
        if (this.queue.length > 0) {
            const item = this.queue.shift();
            return `Dequeued: ${item}`;
        } else {
            return "Queue is empty. Cannot dequeue.";
        }
    }

    display() {
        return `Queue: [${this.queue.join(", ")}]`;
    }

    average() {
        if (this.queue.length === 0) {
            return "Queue is empty. Cannot calculate average.";
        } else {
            const sum = this.queue.reduce((acc, curr) => acc + curr, 0);
            return sum / this.queue.length;
        }
    }
}

const q10 = new Queue(10);
const q20 = new Queue(20);
const q50 = new Queue(50);

function takeContract (){
    document.getElementById("dt_purchase_put_button").click();
    console.log("Trade Done");
    isWatching = false;
    firstCondition = false;
}

function setFirstCondition(){
    value50>value20 && value20>value10 ? firstCondition = true : firstCondition = false;
    if(firstCondition == true){
        takeContract();
    }
    
}

function watching() {
    
    if(isWatching == true){
        setFirstCondition()
    }

    if(value10<value20 && value20<value50 ){
        isWatching = false;
        
    }
    else{
        isWatching =true;
        console.log("Watching");
    }
    return;
}

function start(  ) {
    console.log("Start");
    if (!intervalId) {
        intervalId = setInterval(() => {
            currentVale = document.querySelector('.cq-animated-price.cq-current-price.cq-down');
            if(currentVale == null) 
                currentVale = document.querySelector('.cq-animated-price.cq-current-price.cq-up');
            if(currentVale == null) 
                return;
            currentVale = currentVale.textContent;
            if(currentVale == previousValue) 
                return;  
            previousValue = currentVale;
            currentVale = parseFloat(currentVale);

            q10.enqueue(currentVale);            
            q20.enqueue(currentVale);
            q50.enqueue(currentVale);
            if(q10.queue.length < 10){
                console.log("Queue 10 is not full yet");
                console.log("size: " + q10.queue.length);
                return;
            }
            if(q20.queue.length < 20){
                console.log("Queue 20 is not full yet");
                console.log("size: " + q20.queue.length);
                return;
            }
            if(q50.queue.length < 50){
                console.log("Queue 50 is not full yet");
                console.log("size: " + q50.queue.length);
                return;
            }

            q10.dequeue();
            q20.dequeue();
            q50.dequeue();
            value10 = q10.average();
            value20 = q20.average();
            value50 = q50.average();
            
            watching();


            return;  
        }, 300);
    } 
}






start();