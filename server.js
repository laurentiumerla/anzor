// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var rp = require('request-promise');
var CFMessage = require('./app/models/chatfuel/message');
var CFVariable = require('./app/models/chatfuel/variable');
var ACWService = require('./app/services/accuweather');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

var LUIS_APP_ID = "cf83bf53-8b33-4d24-8e19-133749db68da";
var LUIS_SUBSCRIPTION_KEY = "293077c0e3be4f6390b9e3870637905d";
var acw = new ACWService(rp);
var cfm = new CFMessage;

var returnjson = { "messages": [{ "text": "Nu am inteles mesajul" }] }

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
router.route('/q')
    .get(function (req, res) {
        var location, subject;
        returnjson = { "messages": [{ "text": "Nu am inteles mesajul" }] }

        askLUIS(req.query.q)
            .then(function (data) {
                for (var i = 0, len = data.entities.length; i < len; i++) {
                    switch (data.entities[i].type) {
                        case "Location":
                            // res.json({ message: data.entities[i].entity });
                            location = data.entities[i].entity;
                            break;
                        case "Subject":
                            subject = data.entities[i].entity;
                            break;
                        default:
                            res.json(returnjson);
                    }
                }

                if (location) {
                    acw.CityLookUp(location)
                        .then(function (data) {
                            if (data.length > 0) {
                                // always return current conditions for the first key found
                                acw.GetCurrentConditions(data[0].Key)
                                    .then(function (data) {
                                        // var message = cfm.text;
                                        // message.text = 'Sunt ' +
                                        //     data[0].Temperature.Metric.Value + data[0].Temperature.Metric.Unit +
                                        //     ' si este ' + data[0].WeatherText + '!';

                                        // var image = cfm.image;
                                        // if (data[0].WeatherIcon < 10) {
                                        //     image.attachment.payload.url = "http://developer.accuweather.com/sites/default/files/0" +
                                        //         data[0].WeatherIcon + "-s.png";
                                        // } else {
                                        //     image.attachment.payload.url = "http://developer.accuweather.com/sites/default/files/" +
                                        //         data[0].WeatherIcon + "-s.png";
                                        // }

                                        // returnjson.messages.splice(0, returnjson.messages.length);
                                        // returnjson.messages.push(message);
                                        // returnjson.messages.push(image);
                                        // res.json(returnjson);
                                        res.json(currentConditionMessage(data, returnjson));
                                    })
                            }
                            else {
                                res.json(returnjson);
                            }
                        })
                        .catch(function (err) {
                            console.log("ACW Request ERROR => ", err);
                            res.json(returnjson);
                        })
                } else {
                    res.json(returnjson);
                }
            })
            .catch(function (err) {
                // API call failed... 
                console.log(err);
                res.json(returnjson);
            });
    })

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);


var askLUIS = function (query) {
    var LUIS_EXTRACT_OPTIONS = {
        uri: 'https://api.projectoxford.ai/luis/v2.0/apps/' +
        LUIS_APP_ID + '?subscription-key=' +
        LUIS_SUBSCRIPTION_KEY + '&q=' + query + '&timezoneOffset=0.0',
        json: true // Automatically parses the JSON string in the response 
    };

    return httprp(LUIS_EXTRACT_OPTIONS)
}

var httprp = function (__opt) {
    console.log("Request CALL => ", __opt.uri);
    return rp(__opt)
}

var currentConditionMessage = function (data, _returnjson) {

    var _text = 'Sunt ' +
        data[0].Temperature.Metric.Value + data[0].Temperature.Metric.Unit +
        ' si este ' + data[0].WeatherText + '!';

    // var message = cfm.text;
    // message.text = _text;

    // var image = cfm.image;
    // if (data[0].WeatherIcon < 10) {
    //     image.attachment.payload.url = "http://developer.accuweather.com/sites/default/files/0" +
    //         data[0].WeatherIcon + "-s.png";
    // } else {
    //     image.attachment.payload.url = "http://developer.accuweather.com/sites/default/files/" +
    //         data[0].WeatherIcon + "-s.png";
    // }

    var quickReply = cfm.quickReply;
    quickReply.text = _text;
    quickReply.quick_replies.push({
        "title": "Hourly Forecast",
        "block_names": ["Block1"]
    });
    quickReply.quick_replies.push({
        "title": "5-day forecast",
        "block_names": ["Block1"]
    });

    _returnjson.messages.splice(0, _returnjson.messages.length);
    // _returnjson.messages.push(message);
    // returnjson.messages.push(image);
    _returnjson.messages.push(quickReply);

    return _returnjson;
}