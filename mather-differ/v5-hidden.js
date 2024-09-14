function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function performAction() {
    let number = getRandomNumber(0, 9);
    document.querySelector('.number-selector__selection[data-value="'+number+'"]').click();
    let interval = getRandomNumber(1000, 5000);
    setTimeout(() => {    
        document.getElementById("dt_purchase_digitdiff_button").click();
    }, interval);
    let nextExecutionTime = getRandomNumber(10000, 30000); 
    setTimeout(performAction, nextExecutionTime);
}
performAction();