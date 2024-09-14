let curve = null;


let slope1 = null;
let slope2 = null;

let value1 = null;
let value2 = null;
let value3 = null;


function waitAndCount(count){
    setTimeout(() => {
        console.log("Wait for 60 seconds");        
    }, count);
}


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
            value3 = value2;
            value2 = value1;
            value1 = parseFloat(currentVale);

            if(value3 == null || value2 == null || value1 == null)
                return;
            
            slope1 = value1 - value2;
            slope2 = value2 - value3;

            if(slope1 < 0 && slope2 < 0){
                console.log("Slope is down");
            }
            else{
                console.log("Slope is not down");
                return
            }
                
            curve = slope1 - slope2;

            if(curve < 0){
                console.log("Curve is down");
                console.log("Let's Trade");
                if( document.getElementById("dt_barrier_1_input").value == "+0.7"){
                        document.getElementById("dt_purchase_put_button").click();
                        console.log("Trade Done");
                        
                }
                else{
                    console.log("Trade not done");
                    console.log("Barrier is not +0.7");
                }

                
                curve = slope1 = slope2 = value1 = value2 = value3 = null;
                waitAndCount(1000*10);
            }
            else{
                console.log("Curve is not down");
                return
            }

            

            waitAndCount(60);  
            return;  
        }, 300);
    } 
}

start();