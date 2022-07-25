const crypto = require('crypto');

// import all the models, we'll need to check, for each type, that the generated ID doesn't
// already exist in the DB.
const {Dialogue} = require('../models');

// set up this object for easy access later.
const models = {
    dialogue: Dialogue,
}

/**
 * Create a 'key' for the whisper. This is basically just a random string.
 *
 * @param type - the category of 'whisper' that the key is for
 * @return {Promise<string>}
 *
 */
async function generateKey(type) {
    const initial = crypto.randomBytes(8).toString("hex");
    const terminal = crypto.randomBytes(5).toString("hex");

    const key = `${initial}-${terminal}`;

    // whilst unlikely, it is possible that the key will be a duplicate, so
    // we check the DB for a whisper with the same key and, if one exists,
    // we recursively call the `generateKey` method.
    const doc = await models[type].findOne({key});
    if (doc) await generateKey(type);
    // if the key *is* unique, we return it
    else {
        return key;
    }
}

module.exports = { generate: generateKey };
