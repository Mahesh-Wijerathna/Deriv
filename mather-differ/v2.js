let intervalId = null;
let current_val = null;
let prev_val = null;
let prev_last_digit = null;
let current_last_digit = null;
let given_target = -1;
let count = 0;
let ready_to_bet = false;
let bet = false;
let interval = 0;

function keepMinute() {
    stop();
    console.log("waiting with count down ");
    let count = interval;
    const countdown = setInterval(() => {
        console.log(count);
        count--;
        if (count === 0) {
            clearInterval(countdown);
            start();
        }
    }, 1000);    
}

function start(  ) {
    
    console.log("starting");
    if (!intervalId) {
        intervalId = setInterval(() => {
            current_val = document.querySelector('.cq-animated-price.cq-current-price.cq-down');
            if(current_val == null) 
                current_val = document.querySelector('.cq-animated-price.cq-current-price.cq-up');
            if(current_val == null) 
                return;
            current_val = current_val.textContent;
            if(current_val == prev_val) 
                return;  
            prev_val = current_val ;
            current_val = parseFloat(current_val);
            prev_last_digit = current_last_digit;
            current_last_digit = (current_val*1000) % 10;
            console.log(current_last_digit );
            
            const digits = document.querySelectorAll('.digits__digit');
            const numbers = [];
            const percentages = [];

            digits.forEach(digit => {
                const number = digit.querySelector('.digits__digit-display-value').textContent;
                const percentage = parseFloat(digit.querySelector('.digits__digit-display-percentage').textContent);
                numbers.push(parseInt(number));
                percentages.push(percentage);
            });

            // Find the index of the number with the least percentage
            const minPercentage = Math.min(...percentages);
            const index = percentages.indexOf(minPercentage);
            const leastNumber = numbers[index];

            //console.log("The first least number is:", leastNumber);
            document.querySelector('.number-selector__selection[data-value="'+leastNumber+'"]').click();
            
            if(leastNumber == current_last_digit){
                document.getElementById("dt_purchase_digitdiff_button").click();
                console.log('betting : next number is not '+leastNumber);
                interval += 1000;
                stop();
            }  


            
            
            
            
            
        }, 300);
    } 
}

function stop() {
    if (intervalId) {
        

        clearInterval(intervalId);
        intervalId = null;
    }
}

start();


//  0.5
//  0.53 + 0.03*4 = 0.65
//  (0.53 + 0.03*2)