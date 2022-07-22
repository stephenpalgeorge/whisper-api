const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { Dialogue } = require('../models');
const { key, wid } = require('../utils');

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        // const { name, password } = req.body;
        const name = req.body['dialogue-name'];
        const password = req.body['dialogue-password'];
        // generate other field values:
        const dialogueKey = await key.generate('dialogue');
        const dialogueId = await wid.generate('dialogue');

        const data = { name, key: dialogueKey, wid: dialogueId, password };
        if (req.body['dialogue-description']) data.description = req.body['dialogue-description'];

        // create new dialogue and send it back to client
        const dialogue = new Dialogue(data);
        const newDialogue = await dialogue.save();

        res.json({ dialogue: newDialogue });
    } catch (e) {
        next(e);
    }
});

router.post('/:id/auth', async (req, res, next) => {
    try {
        // find the dialogue then compare passwords
        const dialogue = await Dialogue.findOne({wid: req.params.id});
        if (!dialogue) {
            res.status(404).json({ origin: 'id', message: `No dialogue found for id: ${req.params.id}` });
            return next(`No dialogue found for id: ${req.params.id}`);
        }

        const { password } = req.body;
        if (!password) {
            res.status(403).json({ origin: 'password', message: 'You must provide a password' });
            return next('You must provide a password');
        }
        const isMatch = await dialogue.comparePassword(password);
        // if incorrect, send an error (403)
        if (!isMatch) {
            res.status(403).json({ origin: 'password', message: 'Incorrect password' });
            return next('Incorrect password');
        }
        // if correct password, set a cookie in the res with JWT that includes dialogue ID
        const token = jwt.sign({ key: dialogue.key }, process.env.TOKEN_SECRET);
        res.status(200).cookie('dialogue:auth', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
        }).json({ dialogue });
    } catch (e) {
        next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        // check headers for corresponding `dialogue:auth` cookie.
        const auth = req.cookies['dialogue:auth'];
        if (!auth) {
            res.status(403).json({ origin: 'auth', message: 'Could not authenticate you for this dialogue.' });
            return next('Could not authenticate you for this dialogue.');
        }

        // If that exists, check the 'key' in the jwt payload matches the 'id' in the req params
        const payload = jwt.decode(auth, process.env.TOKEN_SECRET);
        const isMatch = payload.key === req.params.id;
        if (!isMatch) {
            res.status(403).json({ origin: 'auth', message: 'Could not authenticate you for this dialogue.'});
            return next('Could not authenticate you for this dialogue.');
        }

        // find the dialogue by key, if none exists, send an error
        const dialogue = await Dialogue.findOne({ key: payload.key });
        if (!dialogue) {
            res.status(404).json({ origin: 'auth', message: 'Could not find this dialogue...maybe it has been deleted?'});
            return next('Could not find this dialogue...maybe it has been deleted?');
        }

        // all's good, send the dialogue back to the client.
        res.status(200).json({ dialogue });
    } catch (e) {
        next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const deletedDialogue = await Dialogue.findOneAndDelete({id: req.params.id});
        res.json({ dialogue: deletedDialogue });
    } catch (e) {
        next(e);
    }
});

module.exports.dialogue = router;
