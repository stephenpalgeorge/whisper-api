const crypto = require('crypto');

// import all the models, we'll need to check, for each type, that the generated ID doesn't
// already exist in the DB.
const {Dialogue} = require('../models');

const models = {
    dialogue: Dialogue,
}

async function generateKey(type) {
    const initial = crypto.randomBytes(8).toString("hex");
    const terminal = crypto.randomBytes(5).toString("hex");

    const key = `${initial}-${terminal}`;

    const doc = await models[type].findOne({key});
    if (doc) await generateWID(type);
    else {
        return key;
    }
}

module.exports = { generate: generateKey };
