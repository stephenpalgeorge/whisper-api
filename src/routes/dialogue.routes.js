const { Router } = require('express');
const { Dialogue } = require('../models');
const { key, wid } = require('../utils');

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        const { name, password } = req.body;
        // generate other field values:
        const dialogueKey = await key.generate('dialogue');
        const dialogueId = await wid.generate('dialogue');

        // create new dialogue and send it back to client
        const dialogue = new Dialogue({ name, key: dialogueKey, wid: dialogueId, password });
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
        res.status(200).cookie('dialogue:auth', req.params.id, {httpOnly: true}).json({ dialogue });
    } catch (e) {
        next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    // check headers for corresponding `dialogue:auth` cookie.
    // If that exists, we can return the `dialogue` info, otherwise, send a 403.
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