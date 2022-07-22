const { model, Schema } = require('mongoose');
const bcrypt = require('bcrypt');

const dialogueSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    wid: String,
    key: String,
    password: { type: String, required: true },
});

dialogueSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (e) { return next(e); }
});

dialogueSchema.methods.comparePassword = async function(candidate) {
    return bcrypt.compare(candidate, this.password);
}

module.exports['Dialogue'] = model('Dialogue', dialogueSchema);
