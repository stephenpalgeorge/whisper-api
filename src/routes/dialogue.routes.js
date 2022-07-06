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

router.delete('/:id', async (req, res, next) => {
    try {
        const deletedDialogue = await Dialogue.findOneAndDelete({id: req.params.id});
        res.json({ dialogue: deletedDialogue });
    } catch (e) {
        next(e);
    }
});

module.exports.dialogue = router;
