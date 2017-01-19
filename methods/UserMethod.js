var async = require('async');
var UserModel = require('../models/UserModel')
var UserMethods = {
    
    registerUser: function(userData, callback){
        //console.log(userData);
        async.waterfall([
            function(nextcb){
                var errMsg = "";
                UserModel.count({email: userData.email}, function(err, e_count){
                            //console.log("e_count : ", e_count);
                            if(err){
                                nextcb(err);
                            }
                            else if(e_count > 0){
                                errMsg = "Email id already registered, please use another one";
                            }
                            nextcb(null, errMsg);
                        });
            },
            function(errMsg, nextcb){
                if(errMsg != "")
                    nextcb(null, errMsg, null);
                else {
                    var user = new UserModel(userData);
                    //console.log(user);
                    user.save(function(err, res){
                        if(err)
                            nextcb(err);
                        else
                            nextcb(null, errMsg, res);
                    })
                }
            }
        ], function(err, errMsg, res){
            //console.log("errMsg : ", errMsg);
            
            if(err)
                callback({success: false, message: "Some internal error has occurred", err: err});
            else if (errMsg != "")
                callback({success: false, message: errMsg});
            else
                callback({success: true, message: "Registration successful, please login now", data: res});
        });
    },
    
    checkEmail: function(email, callback){
        if(typeof(email) == "undefined")
            callback({success: false, message: "email id not defined"});
        else {
            UserModel.count({email: email}, function(err, e_count){
                //e_count = 1;
                if(e_count == 0)
                    callback({success: true, message: "email id is available"});
                else
                    callback({success: false, message: "email already in use"});
            });
        }
            
    },
    
    userAuth: function(userdata, ua_str, callback){
        if(!userdata.email || userdata.email == ""){
            callback({success: false, message: "provide username", message_id: "enter_username"});
        }
        else if(!userdata.password || userdata.password == ""){
            callback({success: false, message: "provide password", message_id: "enter_password"});
        }
        else{
            UserModel.findOne({username: userdata.email})
                .select('username password first_name last_name').exec(function(err, user){
                    if(err){
                        throw err;
                    }
                    if(!user){
                        callback({success: false, message: "user doesn't exist"});
                    }
                    else {
                        if(!user.comparePassword(userdata.password)){
                            callback({success: false, message: "invalid password"});
                        }
                        else if(!user.is_active){
                            callback({success: false, message: "account not activated"});
                        }
                        else if(!user.phone_verified){
                            callback({success: false, message: "phone number not verified", message_id: "msg_phn_verified"});
                        }
                        else{
                            
                            var UAParser = require('ua-parser-js');
                            var parser = new UAParser();
                            //console.log(ua_str);
                            //var ua = req.headers['user-agent'];     // user-agent header from an HTTP request
                            var uaObj = parser.setUA(ua_str);
                            //console.log(uaObj);
                            //console.log(uaObj.getOS());
                            var user_agent = uaObj.getResult();
                            //console.log(typeof(user_agent));
                            
                            var device_token = null;
                            if(typeof(userdata.device_token) != 'undefined'){
                                device_token = userdata.device_token;
                            }
                            
                            //========= Updating user record ===========//
                            var conditions = {_id: user.id},
                                fields = {is_logged_in: true, user_agent: user_agent, device_token: device_token, last_login: Date.now()},
                                options = {upsert: false};
                                
                            UserModel.update(conditions, fields, options, function(err, affected){
                                //console.log("Affected rows %d", affected.nModified);
                                user.last_login = fields.last_login;
                            });
                            //console.log(typeof user.available_credit);
                            
                            var token = createToken(user);
                            //console.log(user);
                            callback({success: true, message: "successfully logged in", message_id: "login_success", token: token});                            
                        }
                    }
                });
        }
    }
}

module.exports = UserMethods;