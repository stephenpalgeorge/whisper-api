const crypto = require('crypto');
const { Dialogue } = require('../models');

const models = {
    dialogue: Dialogue,
}

async function generateWID(type) {
    const wid = crypto.randomBytes(6).toString('hex');

    const doc = await models[type].findOne({wid});
    if (doc) await generateWID(type);
    else {
        return wid.toUpperCase();
    }
}

module.exports = { generate: generateWID };
