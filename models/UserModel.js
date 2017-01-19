var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email           :       {type: String, required: true, index: {unique: true}},
    password        :       {type: String, required: true, select: false},
    first_name      :       {type: String, default: null},
    last_name       :       {type: String, default: null},
    device_token    :       {type: String, default: null},    
    user_agent      :       {type: Schema.Types.Mixed, default: null},
    last_login      :       {type: Date, default: null},
    is_online       :       {type: Boolean, default: false},
    last_seen       :       {type: Date, default: null},
    is_active       :       {type: Boolean, default: true},
    is_logged_in    :       {type: Boolean, default: false}
},{
    timestamps: true,
    typecast: true
});

UserSchema.pre('save', function(next){
    var user = this;
    if(!user.isModified('password')){return next();}
    
    bcrypt.hash(user.password, null, null, function(err, hash){
        if(err){return next(err);}
        
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password){
    var user = this; 
    //console.log("user", user);
    return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('User', UserSchema);