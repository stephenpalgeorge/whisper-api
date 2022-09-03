const winston = require('winston');

const transports = [];

if (process.env.NODE_ENV === 'development') {
    transports.push(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports,
})

module.exports = logger;
