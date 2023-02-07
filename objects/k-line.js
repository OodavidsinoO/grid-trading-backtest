/**
 * @description: represent a k-line chart
 * @author: Nicky
 */
const RestClient = require('js-lib/rest-client');
const config = require('../config');
const host = 'www.pionex.com'
const port = 443;
const round = n => Math.round(n * 10000) / 10000;
const batchSizeEpoch = 2592000;

class KLine {

    backtest(orders) {
        let totalProfit = 0, sellCount = 0, buyCount = 0;
        const initPrice = this.candles[0].open;
        function sellToPrice(orders, price) {
            let profit = 0;
            let start = orders.findIndex(order => !order.activate);
            while (start >= 1 && orders[start - 1].price <= price) {
                // complete sell order orders[start - 1]
                // console.log(`Sell operation @ ${round(orders[start - 1].price)}`);
                totalProfit -= 0.0005;
                if (orders[start - 1].init) {
                    if (config.includeInitProfit) {
                        profit += (orders[start - 1].price - initPrice) / initPrice;
                    }
                    orders[start - 1].init = false;
                }
                else {
                    profit += (orders[start - 1].price - orders[start].price) / orders[start].price;
                }
                orders[start - 1].activate = false;
                orders[start].activate = true;
                orders[start].type = 'b';
                start--;
                sellCount++;
            }
            return profit;
        }
        function buyToPrice(orders, price) {
            let start = orders.findIndex(order => !order.activate);
            while (start <= orders.length - 2 && orders[start + 1].price >= price) {
                // complete buy order orders[start + 1]
                // console.log(`Buy operation @ ${round(orders[start + 1].price)}`);
                totalProfit -= 0.0005;
                orders[start + 1].activate = false;
                orders[start].activate = true;
                orders[start].type = 's';
                start++;
                buyCount++;
            }
        }
        // const candle = {
        //     high: 178.67,
        //     low: 177.86,
        //     close: 178.29,
        //     open: 178.27
        // };
        this.candles.forEach(candle => {
            // ohlc estimation is conservative in bear market
            // in bull market, use olhc
            // buy or sell to open
            //console.log('1', orders);
            let start = orders.findIndex(order => !order.activate);
            if (start >= 1 && orders[start - 1].price <= candle.open) {
                totalProfit += sellToPrice(orders, candle.open);
            }
            else if (start < orders.length - 1 && orders[start + 1].price >= candle.open) {
                buyToPrice(orders, candle.open);
            }
            //console.log('2', orders, profit);
            // sell from open to high
            totalProfit += sellToPrice(orders, candle.high);
            //console.log('3', orders, profit);
            // buy from high to low
            buyToPrice(orders, candle.low);
            //console.log('4', orders);
            // sell from low to close
            totalProfit += sellToPrice(orders, candle.close);
            //console.log('5', orders, profit);
        });
        //console.log(this.candles);
        console.log('Sell operation:', sellCount, 'Buy operation:', buyCount);
        totalProfit /= orders.length + 1;
        console.log('Period profit: ', totalProfit);
        return totalProfit;
    }
    async init(start, end, pair, interval) {
        this.pair = pair.split('-');
        let batchCount = Math.ceil(end.diff(start, 'seconds') / batchSizeEpoch);
        let promises = [];
        for (let i = 0; i < batchCount; i++) {
            let batchStart = start.clone().add(i * batchSizeEpoch, 'seconds');
            let batchEnd = batchStart.clone().add(batchSizeEpoch, 'seconds');
            if (batchEnd.isAfter(end)) {
                batchEnd = end;
            }
            promises.push(this.getKLine(batchStart, batchEnd, pair, interval));
            console.log(`Batch candles ${i + 1} of ${batchCount} is loading`);
            // sleep 1 second to avoid 429
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return Promise.all(promises).then(() => {
            this.candles = this.candles.sort((a, b) => a.date - b.date);
            return;
        });
    }
    getKLine(start, end, pair, interval) {
        const path = '/kline/query_unite_candle_data?' + 
            `base=${this.pair[0]}&quote=${this.pair[1]}&market=pionex.v2&` +
            `start=${start.unix()}&end=${end.unix()}&interval=${interval}&from=web`;
        console.log(path);
        return this.restClient.get(path, {"referer": `https://www.pionex.com/en/trade/${this.pair[0]}_${this.pair[1]}`,
                                          "user-agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36 Edg/101.0.1210.39"
                                         }
            ).then(d => {
            if (d.error_code !== 0) {
                console.error(d);
                process.exit(1);
            }
            if (!this.candles) {
                this.candles = d.history_price;
            }
            else {
                this.candles = this.candles.concat(d.history_price);
            }
            // console.log(d);
            return;
        });
    }
    constructor() {
        this.restClient = new RestClient(host, port);
    }
 }
 module.exports = KLine;
