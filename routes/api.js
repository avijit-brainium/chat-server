var express = require('express');
var router = express.Router();

var UserMethod = require('../methods/UserMethod');

var config = require('../config');
var secretKey = config.secret;
var jwt = require('jsonwebtoken');

//======================
//  Middleware to check the login
//=========================

function checkToken(req, res, next){
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    if(token){
        jwt.verify(token, config.secret, function(err, decoded){
            if(err){
                res.status(403).send({success: false, message: "failed to authenticate"});
            }
            else{
                req.decoded = decoded;
                //console.log("req.decoded ", req.decoded);
                
                var Schedule = require('../models/schedules');
                Schedule.findOne({_user: req.decoded.id, is_active: true})
                        .select('start_date end_date is_active schedule_type no_of_days')
                        .exec(function(err, sch){
                            if(err)
                                console.log(err)
                            else{
                                req.decoded.activeSchedule = sch;
                            }
                            return next();
                        })
                
                //
            }
        });
    }
    else{
        res.status(403).send({success: false, message: "token required"});
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  console.log("Test Output");
  res.json({success: true, message: "api routes is working"});
});

/**
 *  POST: /api/sign-up
 *
 *@email {email}
 *@password {String}
 *@first_name {String}
 *@first_name {String}
 */

router.post('/register', function (req, res, next) {
    var reqData = req.body;
    //res.json({response: req.body});
    UserMethod.registerUser(reqData, function (response) {
        res.json(response);
    });
});

router.get('/check-email', function (req, res, next) {
    var reqData = req.body;
    console.log("reqData: ", reqData, "req.params: ", req.param('email'));
    //  res.json({response: req.body});
    UserMethod.checkEmail(req.param('email'), function (response) {
        res.json(response);
    });
});

router.post('/login', function (req, res, next) {
    var reqData = req.body;
    //res.json({response: req.body});
    
    UserMethod.userAuth(reqData, req.headers['user-agent'], function (response) {
        res.json(response);
    });
});




module.exports = router;
