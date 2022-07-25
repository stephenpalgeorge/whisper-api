const { model, Schema } = require('mongoose');
const bcrypt = require('bcrypt');

const dialogueSchema = new Schema({
    // dialogue name
    name: { type: String, required: true },
    // dialogue description - optional, user's can provide a summary of their dialogue
    description: String,
    // wid (whisper id) - a unique identifier for the dialogue
    wid: String,
    // key - another unique string that identifies the dialogue
    // we have this as well as the key, so we can, for example, find a
    // dialogue by `key` and then validate/authenticate by asking for the
    // corresponding `wid`
    key: String,
    // password for accessing the dialogue page - this is encrypted when
    // the model is saved
    password: { type: String, required: true },
});

dialogueSchema.pre('save', async function(next) {
    // check if the record contains an updated/new password. If not,
    // we can just move on
    if (!this.isModified('password')) return next();

    try {
        // create a hashed version of the password and update
        // the Dialogue with the encrypted version
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (e) { return next(e); }
});

// compare a candidate password with the encrypted password that is stored in the DB
// should return a boolean (so `false` if not a match)
dialogueSchema.methods.comparePassword = async function(candidate) {
    return bcrypt.compare(candidate, this.password);
}

module.exports['Dialogue'] = model('Dialogue', dialogueSchema);
