const jwt = require('jsonwebtoken');

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
        req.auth = payload;
        req.isAuth = true;
        next();
    } catch (e) {
        console.log(e.name);
        if (['JsonWebTokenError', 'AuthAccessError'].includes(e.name)) next();
        else {
            res.status(403);
            next(e);
        }
    }
}

function refresh(req, res, next) {
    try {
        console.log('refresh');
        console.log(req.auth);
        // if we arrive at this middleware already authenticated, just pass through
        if (req.isAuth) return next();
        // if not authorised yet, verify the refresh token (should be in the `shh:rt` header)
        // can't verify? forward to error handler
        // otherwise, set new tokens and forward to endpoint
        const REFRESH_TOKEN = req.get('shh:rt');
        if (!REFRESH_TOKEN || REFRESH_TOKEN.length === 0) {
            res.status(403);
            throw new Error('Please login');
        }
        const payload = jwt.verify(REFRESH_TOKEN, process.env.REFRESH_SECRET);
        const NEW_REFRESH_TOKEN = jwt.sign(payload, process.env.REFRESH_SECRET);
        const NEW_AUTH_TOKEN = jwt.sign(payload, process.env.AUTH_SECRET);
        res.cookie('shh:rt', NEW_REFRESH_TOKEN, {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
        });

        req.auth = payload;
        req.isAuth = true;
        req.auth.authToken = NEW_AUTH_TOKEN;
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = {
    access,
    refresh,
}