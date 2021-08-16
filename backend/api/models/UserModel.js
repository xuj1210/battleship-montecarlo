const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Users', UserSchema);