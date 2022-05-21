module.exports = {
    // period for backtesting
    // if both start and end is provided, period: [start, end]
    // if only start is provided, period: [start, start + duration]
    // if only end is provided, period: [end - duration, end]
    // if both start and end are not provided, period: [now - duration, now]
    // format: yyyy-mm-dd hh-mm-ss
    start: '2021-05-23 08:08:08',
    end: '2022-05-21 08:08:08',
    duration: {
        seconds: 0,
        minutes: 0,
        hours: 0,
        days: 2,
        weeks: 0,
        months: 0,
        years: 0
    },
    // pair
    pair: 'BNB-ETH',
    // for days longer than 30, interval should be at least 15m
    // available interval: 1m, 5m, 15m, 30m, 1h, 4h, 8h, 12h, 1d, 1w
    interval: '1h',
    upperLimit: 0.23,
    lowerLimit: 0.1,
    // [2, 250]
    gridQuantRange: [2, 250],
    // whether to use start open price as buy-in price to calculate init profit
    includeInitProfit: true,
    // init principal USDT
    initPrincipal: 0.51,
};