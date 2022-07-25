const crypto = require('crypto');

// import all the models, we'll need to check, for each type, that the generated ID doesn't
// already exist in the DB.
const { Dialogue } = require('../models');

// set up this object for easy access later.
const models = {
    dialogue: Dialogue,
}

/**
 * Create a 'WID' for the whisper. This is basically just a random string.
 *
 * @param type - the category of 'whisper' that the key is for
 * @return {Promise<string>}
 *
 */
async function generateWID(type) {
    const wid = crypto.randomBytes(6).toString('hex');

    // whilst unlikely, it is possible that the key will be a duplicate, so
    // we check the DB for a whisper with the same key and, if one exists,
    // we recursively call the `generateKey` method.
    const doc = await models[type].findOne({wid});
    if (doc) await generateWID(type);
    // if the key *is* unique, we return it, transformed to uppercase
    else {
        return wid.toUpperCase();
    }
}

module.exports = { generate: generateWID };
