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

            
            if(current_last_digit == prev_last_digit){
                temp++;
                if(current_last_digit == 0 && temp > max_zero){
                    max_zero = temp;
                }
                if(current_last_digit == 1 && temp > max_one){
                    max_one = temp;
                }
                if(current_last_digit == 2 && temp > max_two){
                    max_two = temp;
                }
                if(current_last_digit == 3 && temp > max_three){
                    max_three = temp;
                }
                if(current_last_digit == 4 && temp > max_four){
                    max_four = temp;
                }
                if(current_last_digit == 5 && temp > max_five){
                    max_five = temp;
                }
                if(current_last_digit == 6 && temp > max_six){
                    max_six = temp;
                }
                if(current_last_digit == 7 && temp > max_seven){
                    max_seven = temp;
                }
                if(current_last_digit == 8 && temp > max_eight){
                    max_eight = temp;
                }
                if(current_last_digit == 9 && temp > max_nine){
                    max_nine = temp;
                }
                console.log("temp:      " + temp);
                console.log("max_zero:  " + max_zero);
                console.log("max_one:   " + max_one);
                console.log("max_two:   " + max_two);
                console.log("max_three: " + max_three);
                console.log("max_four:  " + max_four);
                console.log("max_five:  " + max_five);
                console.log("max_six:   " + max_six);
                console.log("max_seven: " + max_seven);
                console.log("max_eight: " + max_eight);
                console.log("max_nine:  " + max_nine);
                console.log("\n");


            }
            else{
                if(temp == 2){
                    max_temp_2++;
                }
                if(temp == 3){
                    max_temp_3++;
                }
                if(temp == 4){
                    max_temp_4++;
                }
                if(temp == 5){
                    max_temp_5++;
                }
                if(temp == 6){
                    max_temp_6++;
                }
                if(temp > 1){
                    console.log("temp:      " + temp);
                    console.log("max_temp_2: " + max_temp_2);
                    console.log("max_temp_3: " + max_temp_3);
                    console.log("max_temp_4: " + max_temp_4);
                    console.log("max_temp_5: " + max_temp_5);
                    console.log("max_temp_6: " + max_temp_6);
                    console.log("\n");
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