const jwt = require('jsonwebtoken');
const {config, logger} = require('../utils');

function access(req, res, next) {
    try {
        // check if there is a jwt provided
        if (!req.get('Authorization') || req.get('Authorization').length === 0) {
            const err = new Error('no auth header provided');
            err.name = 'AuthAccessError';
            throw err;
        }
        const AUTH_TOKEN = req.get('Authorization').split('Bearer')[1].trim();

        // verify the jwt (this will throw an error if it fails, so no need for us to handle directly
        const payload = jwt.verify(AUTH_TOKEN, process.env.AUTH_SECRET);
        // jwt is successfully verified, we attach the relevant information to the request
        // and forward to the next middleware
        logger.info('Authorised with Auth Token');
        req.auth = payload;
        req.isAuth = true;
        next();
    } catch (e) {
        if (['JsonWebTokenError', 'AuthAccessError'].includes(e.name)) {
            logger.info('Failed to authorise Auth Token');
            next();
        }
        else {
            res.status(403);
            next(e);
        }
    }
}

function refresh(req, res, next) {
    try {
        // if we arrive at this middleware already authenticated, just pass through
        if (req.isAuth) return next();
        // if not authorised yet, verify the refresh token (should be in the `shh:rt` header)
        // can't verify? forward to error handler
        // otherwise, set new tokens and forward to endpoint
        const REFRESH_TOKEN = req.cookies['shh:rt'];
        if (!REFRESH_TOKEN || REFRESH_TOKEN.length === 0) {
            res.status(403);
            throw new Error('Please login');
        }
        const payload = jwt.verify(REFRESH_TOKEN, process.env.REFRESH_SECRET);
        payload.timestamp = new Date();
        const NEW_REFRESH_TOKEN = jwt.sign(payload, process.env.REFRESH_SECRET, {expiresIn: config.REFRESH_TOKEN_EXPIRATION});
        const NEW_AUTH_TOKEN = jwt.sign(payload, process.env.AUTH_SECRET, {expiresIn: config.AUTH_TOKEN_EXPIRATION});
        res.cookie('shh:rt', NEW_REFRESH_TOKEN, {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
        });

        logger.info('Authorised with Refresh Token');
        req.auth = payload;
        req.isAuth = true;
        req.auth.authToken = NEW_AUTH_TOKEN;
        next();
    } catch (e) {
        logger.info('Could not authorise');
        next(e);
    }
}

module.exports = {
    access,
    refresh,
}