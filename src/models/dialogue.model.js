const { model, Schema } = require('mongoose');

const dialogueSchema = new Schema({
    name: { type: String, required: true },
    wid: String,
    password: { type: String, required: true },
});

module.exports['Dialogue'] = model('Dialogue', dialogueSchema);
