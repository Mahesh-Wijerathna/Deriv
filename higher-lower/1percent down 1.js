let curve = null;


let slope1 = null;
let slope2 = null;

let value1 = null;
let value2 = null;
let value3 = null;

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


const q15 = new Queue(15);






let intervalId = null;
let previousValue = null;
let currentVale = null;


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
            // console.log("new value detected");
            previousValue = currentVale;
            // console.log("previous value" + previousValue )

            currentVale = parseFloat(currentVale);
            // console.log("Current Value: " + currentVale);
            
            q15.enqueue(currentVale);

            if(q15.queue.length < 15){
                console.log("Queue is not full yet");
                return;
            }
            q15.dequeue();
            value3 = value2;
            value2 = value1;
            value1 = q15.average();

            // console.log("Value1: " + value1);
            // console.log("Value2: " + value2);
            // console.log("Value3: " + value3);

            if(value3 == null || value2 == null || value1 == null)
                return;
            
            slope1 = value1 - value2;
            slope2 = value2 - value3;

            // console.log("Slope1: " + slope1);
            // console.log("Slope2: " + slope2);

            if(slope1 < 0 && slope2 < 0){
                // console.log("Slope is down");
            }
            else{
                // console.log("Slope is not down");
                return
            }
                
            curve = slope1 - slope2;
            

            if(curve < -0.01){
                console.log("Curve: " + curve); 
                console.log("Curve is down");
                if( document.getElementById("dt_barrier_1_input").value == "+0.5"){
                        document.getElementById("dt_purchase_put_button").click();
                        console.log("Trade Done");
                        
                }
                else{
                    console.log("Barrier is not +0.5");
                }

                
                curve = slope1 = slope2 = value1 = value2 = value3 = null;
                
            }
            else{
                // console.log("Curve is not down");
                return
            }

            
 
            return;  
        }, 300);
    } 
}
    



start();









What is the answere to 2+2+2+2*2*2 ?

    1) 5
    2) 12
    3) 8
    4) 10
