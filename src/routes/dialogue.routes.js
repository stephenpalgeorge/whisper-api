const { Router } = require('express');
const { Dialogue } = require('../models');

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        const { name, wid, password } = req.body;
        const dialogue = new Dialogue({ name, wid, password });
        const newDialogue = await dialogue.save();
        res.json({ dialogue: newDialogue });
    } catch (e) {
        next(e);
    }
});

router.post('/:id/auth', async (req, res, next) => {
    try {
        // find the dialogue then compare passwords
        const dialogue = await Dialogue.findById(req.params.id);
        if (!dialogue) {
            res.status(404).json({ message: `No dialogue found for id: ${req.params.id}` });
            return next(`No dialogue found for id: ${req.params.id}`);
        }

        const { password } = req.body;
        if (!password) {
            res.status(403).json({ message: 'You must provide a password' });
            return next('You must provide a password');
        }
        const isMatch = await dialogue.comparePassword(password);
        // if incorrect, send an error (403)
        if (!isMatch) {
            res.status(403).json({ message: 'Incorrect password' });
            return next('Incorrect password');
        }
        // if correct password, set a cookie in the res with JWT that includes dialogue ID
        return res.status(200).cookie('dialogue:auth', req.params.id).json({ dialogue });
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