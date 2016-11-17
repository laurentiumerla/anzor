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
var locationLUIS = [], subjectLUIS = [];
var acw = new ACWService(rp);
var cfm = new CFMessage;

var returnjson = { "set_variables": {}, "messages": [{ "text": "Nu am inteles mesajul" }] }

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
router.route('/q')
    .get(function (req, res) {

        returnjson = { "set_variables": {}, "messages": [{ "text": "Nu am inteles mesajul" }] }

        askLUIS(req.query.q)
            .then(function (data) {
                extractEntitiesFromLuis(data); //locationLUIS subjectLUIS

                if (locationLUIS.length < 1) { locationLUIS.push(req.query.location); }

                switch (true) {
                    case (subjectLUIS.indexOf("vremea") != -1):
                        returnACWCurrentConditions(res, returnjson);
                        break;
                    case (subjectLUIS.indexOf("prognoza") != -1):
                        switch (true) {
                            case (subjectLUIS.indexOf("ore") != -1):
                                returnACWForecast12Hours(res, returnjson);
                                break;
                            case (subjectLUIS.indexOf("zile") != -1):
                                returnACWForecast5Days(res, returnjson);
                                break;
                        }
                        break;
                }

                // if (subjectLUIS.indexOf("vremea") != -1) { returnACWCurrentConditions(res, returnjson); }

                // if (subjectLUIS.indexOf("prognoza") != -1) {
                //     if (subjectLUIS.indexOf("ore") != -1) {
                //         returnACWForecast12Hours(res, returnjson);
                //     } else if (subjectLUIS.indexOf("zile") != -1) {
                //         returnACWForecast5Days(res, returnjson);
                //     }
                // }
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

var extractEntitiesFromLuis = function (_data) {
    locationLUIS = [];
    subjectLUIS = [];
    for (var i = 0, len = _data.entities.length; i < len; i++) {
        switch (_data.entities[i].type) {
            case "Location":
                locationLUIS.push(_data.entities[i].entity);
                break;
            case "Subject":
                subjectLUIS.push(_data.entities[i].entity);
                break;
        }
    }
}

var httprp = function (__opt) {
    console.log("Request CALL => ", __opt.uri);
    return rp(__opt)
}

var multipleLocationChoices = function (data, _returnjson) {
    return currentConditionMessage(data, _returnjson);
}

var returnACWCurrentConditions = function (_res, _returnjson) {
    if (locationLUIS.length > 0) {
        acw.CityLookUp(locationLUIS[0])
            .then(function (data) {
                if (data.length > 0) {
                    // always return current conditions for the first key found
                    acw.GetCurrentConditions(data[0].Key)
                        .then(function (data) { _res.json(currentConditionsMessage(data, _returnjson)); })
                }
                else {
                    _res.json(_returnjson);
                }
            })
            .catch(function (err) {
                console.log("ACW Request ERROR => ", err);
                _res.json(_returnjson);
            })
    } else {
        _res.json(_returnjson);
    }
}

var currentConditionsMessage = function (_data, _returnjson) {

    //Clear the message
    _returnjson.messages.splice(0, _returnjson.messages.length);

    if (locationLUIS.length < 1) {
        // set location variable to chatfuel
        _returnjson.set_variables.location = locationLUIS[0];
    }

    var _text = 'In ' + locationLUIS[0] + ' sunt ' +
        _data[0].Temperature.Metric.Value + _data[0].Temperature.Metric.Unit +
        ' si este ' + _data[0].WeatherText + '!';

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

    // _returnjson.messages.push(message);
    // _returnjson.messages.push(image);

    var quickReply = cfm.quickReply;
    quickReply.text = _text;
    quickReply.quick_replies = [];
    quickReply.quick_replies.push({
        "title": "Prognoza pe ore",
        "block_names": ["Typing", "ASKLUIS"]
    });
    quickReply.quick_replies.push({
        "title": "Prognoza pe 5 zile",
        "block_names": ["Typing", "ASKLUIS"]
    });
    _returnjson.messages.push(quickReply);
    return _returnjson;
}

var returnACWForecast12Hours = function (_res, _returnjson) {
    if (locationLUIS.length > 0) {
        acw.CityLookUp(locationLUIS[0])
            .then(function (data) {
                if (data.length > 0) {
                    // always return current conditions for the first key found
                    acw.GetForecast12Hours(data[0].Key)
                        .then(function (data) { _res.json(forecast12HoursMessage(data, _returnjson)); })
                }
                else {
                    _res.json(_returnjson);
                }
            })
            .catch(function (err) {
                console.log("ACW Request ERROR => ", err);
                _res.json(_returnjson);
            })
    } else {
        _res.json(_returnjson);
    }
}

var forecast12HoursMessage = function (_data, _returnjson) {
    //Clear the message
    _returnjson.messages.splice(0, _returnjson.messages.length);

    var list = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "list",
                "top_element_style": "compact",
                "elements": []
            }
        }
    }

    for (var i = 0, len = _data.length; i < len; i++) {
        var item = _data[i];
        var d = new Date(item.DateTime);
        var h = d.getHours();

        var element =
            {
                "title": "Classic White T-Shirt",
                "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
                "subtitle": "100% Cotton, 200% Comfortable"
            };

        element.title = "La ora " + h.toString() + ":00 vor fi " + item.Temperature.Value + item.Temperature.Unit;
        element.image_url = "http://developer.accuweather.com/sites/default/files/0" + item.WeatherIcon + "-s.png";
        element.subtitle = item.IconPhrase;

        list.attachment.payload.elements.push(element);
    }

    return _returnjson.messages.push(list);
}

var returnACWForecast5Days = function (_res, _returnjson) {
}

var forecast5DaysMessage = function (_data, _returnjson) {
}