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

let temp = 1;
let max_zero = 0;
let max_one = 0;
let max_two = 0;
let max_three = 0;
let max_four = 0;
let max_five = 0;
let max_six = 0;
let max_seven = 0;
let max_eight = 0;
let max_nine = 0;

let max_temp_2 = 0;
let max_temp_3 = 0;
let max_temp_4 = 0;
let max_temp_5 = 0;
let max_temp_6 = 0;

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
            document.querySelector('.number-selector__selection[data-value="'+current_last_digit+'"]').click();
                

            
            if(current_last_digit == prev_last_digit){
                
                temp++;
            //     if( ready_to_bet == true ){
            //         document.getElementById("dt_purchase_digitdiff_button").click();
            //         console.log(current_last_digit + " appeared " +temp + " times")
            //         console.log("taken");
            //         ready_to_bet = false;
            // }
                
                if(temp == 2 ){
                    console.log(current_last_digit + " appeared " +temp + " times")
                    ready_to_bet = true;
                    console.log("ready to bet")
                }
                
                 
                

            }
            else{

                if(temp == 2){
                    console.log(current_last_digit + " appeared " +temp + " times")
                    document.getElementById("dt_purchase_digitdiff_button").click();
                    console.log(current_last_digit + " appeared " +temp + " times")
                    console.log("taken");
                }
                
                temp = 1;

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