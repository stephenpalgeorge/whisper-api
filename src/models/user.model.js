const { model, Schema } = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    // the Dialogues list tracks all Dialogues that the user is part of,
    // regardless of permissions level.
    Dialogues: { type: [Schema.Types.ObjectId], ref: 'Dialogue' },
});

userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidate) {
    return bcrypt.compare(candidate, this.password);
}

module.exports['User'] = model('User', userSchema);
