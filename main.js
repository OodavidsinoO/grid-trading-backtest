'use strict';
const config = require('./config');
const KLine = require('./objects/k-line');
const moment = require('moment');

const round = n => Math.round(n * 10000) / 10000;
const isProvided = s => s !== undefined && s !== '';
function createOrders(gridQuant, currentPrice) {
    const delta = (config.upperLimit - config.lowerLimit) / (gridQuant - 1);
    const orders = [];
    // sell order
    for (let p = config.upperLimit; p >= currentPrice; p -= delta) {
        orders.push({ price: round(p), type: 's', activate: true, init: true });
    }
    for (let p = config.lowerLimit; p <= currentPrice; p += delta) {
        orders.push({ price: round(p), type: 'b', activate: true, init: false });
    }
    orders[orders.length - 1].activate = false;
    orders.sort((a, b) => b.price - a.price);
    return orders;
}
// get time from config
let start = undefined, end = undefined;
if (isProvided(config.start) && isProvided(config.end)) {
    start = moment(config.start);
    end = moment(config.end);
}
else if (isProvided(config.start && !isProvided(config.end))) {
    start = moment(config.start);
    end = moment(config.start).add(config.duration);
}
else if (isProvided(config.end && !isProvided(config.start))) {
    end = moment(config.end);
    start = moment(config.end).subtract(config.duration);
}
else {
    end = moment();
    start = moment().subtract(config.duration);
}
console.log('Start:', start.toString());
console.log('End:', end.toString());
// get k-line
const kl = new KLine();
kl.init(start, end, config.pair, config.interval).then(() => {
    console.log('K-Line initialized');
    // debug
    // console.log(kl.candles, start, end, config.pair, config.interval);
    // backtest
    let maxProfit = -Infinity, bestGridQuant = config.gridQuantRange[0];
    for (let gridQuant = config.gridQuantRange[0]; gridQuant <= config.gridQuantRange[1]; gridQuant++) {
        console.log('Testing Grid Quantity =', gridQuant);
        const orders = createOrders(gridQuant, kl.candles[0].open);
        const profit = kl.backtest(orders);
        if (profit > maxProfit) {
            maxProfit = profit;
            bestGridQuant = gridQuant;
        }
    }
    const days = (end - start) / 86400000;
    const annualReturn = round(maxProfit * 365 / days * 100);
    console.log('\x1B[32m=== Report ===\x1b[0m');
    console.log('Starting Time:', start.toString());
    console.log('Ending Time:', end.toString());
    console.log(`Initial Principal: \x1B[33m${config.initPrincipal} ${config.pair.split('-')[1]}\x1b[0m`);
    console.log('Best Grid Quantity:', bestGridQuant);
    console.log(`Max Period Profit: \x1b[32m${round(maxProfit * 100)} % (${round(config.initPrincipal * (1 + maxProfit))} ${config.pair.split('-')[1]})\x1b[0m`);
    console.log(`Estimated Annual Return: \x1b[32m${annualReturn} % (${round(config.initPrincipal * (1 + annualReturn/100))} ${config.pair.split('-')[1]})\x1b[0m`);
    console.log('\x1B[32m=== End Report ===\x1b[0m');
});



