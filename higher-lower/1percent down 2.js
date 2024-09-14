let numbers =[]
let averages= []

let dots = 0;
function waiting(){        
    // console.clear();
    console.log("Waiting  " + ".".repeat(dots));
    dots = (dots+1)%4;     
}

// filling array

let intervalId = null;
let previousValue = null;
let currentVale = null;
function filling(  ) {
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
            numbers.push(parseFloat(currentVale));  
            if(numbers.length <5) {
                console.clear();
                console.log("Filing array:  " + ((numbers.length+1)/5)*100 + " %");
                console.log(numbers);
                return;
            }            
            averages.push((numbers.reduce((acc, num) => acc + num, 0))/5);
            numbers.shift();
            if(averages.length<4){
                console.clear();
                console.log("Filing avg:  " + ((averages.length+1)/4)*100 + " %");
                console.log(averages);
                return;
            }
            console.log(averages);
            console.log(averages[1]-averages[0]);
            console.log(averages[2]-averages[1]);
            console.log(averages[3]-averages[2]);
            if( averages[1] - averages[0] > +0.1 
                && averages[2] - averages[1] > averages[1] - averages[0]
                && averages[3] - averages[2] > averages[2] - averages[1]){
                    document.getElementById("dt_purchase_onetouch_button").click();
                    var audio = new Audio( 'https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3'); 
                    audio.play();
                    // clearInterval(intervalId);
                    console.log("Take the trade");
                
            }  
            if( averages[1] - averages[0] < -0.1 
                && averages[2] - averages[1] < averages[1] - averages[0]
                && averages[3] - averages[2] < averages[2] - averages[1]){
                    document.getElementById("dt_purchase_onetouch_button").click();
                    var audio = new Audio( 'https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3'); 
                    audio.play();
                    // clearInterval(intervalId);
                    console.log("Take the trade");
                
            }
            averages.shift();            
            waiting();
            return

        }, 300);
    } 
}

filling();
