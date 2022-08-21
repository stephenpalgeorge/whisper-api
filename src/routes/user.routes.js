const jwt = require('jsonwebtoken');
const { Router } = require('express');
const router = Router();
const { User } = require('../models');
const { auth } = require('../middleware');

router.post('/secret', [auth.access, auth.refresh], (req, res, next) => {
    res.json({ message: 'you can see the secret', token: req.auth.authToken });
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
        const authToken = jwt.sign(payload, process.env.AUTH_SECRET);
        const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET);
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

module.exports.user = router;
