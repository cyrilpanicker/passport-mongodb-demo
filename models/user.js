var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
    },
	username: {
        type: String,
        unique:true,
		required: true
    },
    password: {
		type: String,
		required: true
    }
});

// userSchema.statics.hash = function(password,callback){
//     return bcrypt.hash(password,10,function(error,hash){
//         callback(hash);
//     });
// };

userSchema.methods.isValidPassword = function(password){
    return password == this.password;
};

module.exports = mongoose.model('user', userSchema);