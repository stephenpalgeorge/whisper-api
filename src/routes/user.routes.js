const jwt = require('jsonwebtoken');
const { Router } = require('express');
const router = Router();
const { User } = require('../models');
const { auth } = require('../middleware');
const { config } = require('../utils');

router.post('/authorise', [auth.access, auth.refresh], (req, res, next) => {
    res.status(200).json({origin: 'auth-check', message: 'authentication successful'});
});

/**
 * @method 'POST'
 * '/api/user' - create a new user and save it to the database.
 */
router.post('/', async (req, res, next) => {
    try {
        // get fields from the request body and construct a new user
        const email = req.body['signup-email'];
        const username = req.body['signup-username'];
        const password = req.body['signup-password'];
        const user = new User({ username, email, password });
        // save user to the database and send the new document back to the client
        const newUser = await user.save();

        // @todo - remove password from user object
        res.json({ user: newUser });
    } catch (e) {
        next(e);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        // find a user by username
        const {username, password} = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            res.status(403).json({ origin: 'username', message: `No user found for name "${username}"` });
            return next('No user found');
        }
        // authenticate by password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(403).json({ origin: 'password', message: 'Incorrect password' });
            return next('Incorrect password');
        }

        // sign and send back 2 jwts - access and refresh
        const payload = { id: user.id, username: user.username };
        const authToken = jwt.sign(payload, process.env.AUTH_SECRET, {expiresIn: config.AUTH_TOKEN_EXPIRATION});
        const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {expiresIn: config.REFRESH_TOKEN_EXPIRATION});
        res.status(200).cookie('shh:rt', refreshToken, {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
        }).json({ user, token: authToken });
        // ^ @todo - remove password from user object
    } catch (e) {
        next(e);
    }
});


router.get('/', [auth.access, auth.refresh], async (req, res, next) => {
    try {
        // by this point, we know that `req.auth` will exist and have an `id` prop,
        // as it would otherwise have been rejected by the auth middleware.
        const id = req.auth.id;
        // find the user and handle the response:
        const user = await User.findOne({id}).populate('Dialogues').exec();
        if (!user) {
            res.status(404).json({ origin: 'Get user', message: 'No user found for that ID' });
            return next('Could not find user.');
        }

        const response = {user};
        // if the authToken/access token failed in the middleware, the refresh middleware
        // will have generated new tokens, so pass it along in the response
        if (req.auth.authToken) response['authToken'] = req.auth.authToken;
        res.json(response);
    } catch (e) {
        next(e);
    }
});

module.exports.user = router;
