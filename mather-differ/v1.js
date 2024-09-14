function waitFor30Seconds() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 30000); // 30000 milliseconds = 30 seconds
    });
  }
  

  waitFor30Seconds().then(() => {
    console.log("30 seconds have passed");
  });


  ///*** */
  let intervalId = null;
let current_val = null;
let prev_val = null;
let prev_last_digit = null;
let current_last_digit = null;
let given_target = -1;
let count = 0;
let ready_to_bet = false;
let bet = false;


function start( target ) {
    given_target = target;
    console.log("after "+given_target + " same, next must "+given_target +"be changed");
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
            document.querySelector('.number-selector__selection[data-value="'+current_last_digit+'"]').click();
            console.log(current_last_digit );
            
            if(current_last_digit == prev_last_digit){
                
                count++;
                
                if(count == given_target && ready_to_bet ){
                    document.getElementById("dt_purchase_digitdiff_button").click();
                    console.log('betting');
                    ready_to_bet = false;
                    bet = true;
                }

                if(count > given_target){
                    if(bet){
                        //given_target++;
                        bet = false;
                        console.log("lost ");
                    }
                    ready_to_bet = true;
                    console.log("ready to bet");
                }

            }
            if(current_last_digit != prev_last_digit){
                count = 1;
                bet = false;
            }
            return;
            
            
            
        }, 300);
    } 
}

function stop() {
    if (intervalId) {
        

        clearInterval(intervalId);
        intervalId = null;
    }
}

start(2);