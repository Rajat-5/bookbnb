const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
      },
    email: {
        type:String, 
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true,
        min: 8,
      },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;