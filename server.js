// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
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
var FACEBOOK_VERIFY_TOKEN = "AnzorWeatherApp2016";
var FACEBOOK_PAGE_ACCESS_TOKEN = "EAACiVL482jQBAMNa9choK9xtIZAkwE0iqZC9RFmfOVPhtfCgzfHq0BuJrACDq8ZCvmgXicCjUpVszrSPzUBS6rLZCUsEGRTm45p84T2CxZCQKzdjdTIjV51QPxxZBludTRVURt19ZBOXrhAUrMtpQxaiEgdZC0myNIivkuCRzI61UwZDZD";
var locationLUIS = [], subjectLUIS = [];
var acw = new ACWService(rp);
var cfm = new CFMessage;

var returnjson = { "set_variables": {}, "messages": [{ "text": "Nu am inteles mesajul" }] }

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function (req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });
// });

// more routes for our API will happen here
// router.route('/q')
//     .get(function (req, res) {

//         returnjson = { "set_variables": {}, "messages": [{ "text": "Nu am inteles mesajul" }] }

//         askLUIS(req.query.q)
//             .then(function (data) {
//                 extractEntitiesFromLuis(data); //locationLUIS subjectLUIS

//                 if (locationLUIS.length < 1) { locationLUIS.push(req.query.location); }

//                 console.log(subjectLUIS);

//                 switch (true) {
//                     case (subjectLUIS.indexOf("vremea") != -1):
//                         returnACWCurrentConditions(res, returnjson);
//                         break;
//                     case (subjectLUIS.indexOf("prognoza") != -1):
//                         switch (true) {
//                             case (subjectLUIS.indexOf("ore") != -1):
//                                 returnACWForecast12Hours(res, returnjson);
//                                 break;
//                             case (subjectLUIS.indexOf("zile") != -1):
//                                 returnACWForecast5Days(res, returnjson);
//                                 break;
//                         }
//                         break;
//                 }
//             })
//             .catch(function (err) {
//                 // API call failed... 
//                 console.log(err);
//                 res.json(returnjson);
//             });
//     })

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === FACEBOOK_VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
})

app.post('/webhook', function (req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function (entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function (event) {
                if (event.message) {
                    receivedMessage(event);
                } else {
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
    }
});

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

var httprp = function (_opt) {
    console.log("Request CALL => ", _opt.uri);
    return rp(_opt);
}

var multipleLocationChoices = function (data, _returnjson) {
    return currentConditionMessage(data, _returnjson);
}

// var returnACWCurrentConditions = function (_res, _returnjson, _senderID) {
//     if (locationLUIS.length > 0) {
//         acw.CityLookUp(locationLUIS[0])
//             .then(function (data) {
//                 if (data.length > 0) {
//                     // always return current conditions for the first key found
//                     acw.GetCurrentConditions(data[0].Key)
//                         .then(function (data) { _res.json(currentConditionsMessage(data, _returnjson, _senderID)); })
//                 }
//                 else {
//                     _res.json(_returnjson);
//                 }
//             })
//             .catch(function (err) {
//                 console.log("ACW Request ERROR => ", err);
//                 _res.json(_returnjson);
//             })
//     } else {
//         _res.json(_returnjson);
//     }
// }

function currentConditionsMessage(_data, _senderID) {

    var message = { "text": "", "quick_replies": [] }

    message.text = 'In ' + locationLUIS[0] + ' sunt ' +
        _data[0].Temperature.Metric.Value + _data[0].Temperature.Metric.Unit +
        ' si este ' + _data[0].WeatherText + '!';
    message.quick_replies.push({
        "content_type": "text",
        "title": "Prognoza pe ore",
        "payload": "PROGNOZA_PE_ORE"
    });
    message.quick_replies.push({
        "content_type": "text",
        "title": "Prognoza pe 5 zile",
        "payload": "PROGNOZA_PE_ZILE"

    });

    sendGenericMessage(_senderID, message);
}

var returnACWForecast12Hours = function (_res, _returnjson) {
    if (locationLUIS.length > 0) {
        acw.CityLookUp(locationLUIS[0])
            .then(function (data) {
                if (data.length > 0) {
                    // always return current conditions for the first key found
                    acw.GetForecastHours(data[0].Key)
                        .then(function (data) { _res.json(forecastHoursMessage(data, _returnjson)); })
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

var forecastHoursMessage = function (_data, _senderID) {
    //Clear the message
    // _returnjson.messages.splice(0, _returnjson.messages.length);

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

        if (i > 4) { return }

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
    // _returnjson.messages.push(list);
    // return _returnjson;
    sendGenericMessage(_senderID, list);
}

var returnACWForecast5Days = function (_res, _returnjson) {
}

var forecast5DaysMessage = function (_data, _returnjson) {
}

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;

    var messageText = message.text;
    var messageAttachments = message.attachments;

    askLUIS(messageText)
        .then(function (data) {
            extractEntitiesFromLuis(data); //locationLUIS subjectLUIS

            if (locationLUIS.length < 1) { locationLUIS.push(req.query.location); }

            console.log(subjectLUIS);

            switch (true) {
                case (subjectLUIS.indexOf("vremea") != -1):
                    ACWCurrentConditions(senderID);
                    break;
                case (subjectLUIS.indexOf("prognoza") != -1):
                    switch (true) {
                        case (subjectLUIS.indexOf("ore") != -1):
                            ACWForecast12Hours(senderID);
                            break;
                        case (subjectLUIS.indexOf("zile") != -1):
                            returnACWForecast5Days(res, returnjson);
                            break;
                    }
                    break;
            }
        })
        .catch(function (err) {
            // API call failed... 
            console.log(err);
            // res.json(returnjson);
        });

    // if (messageText) {

    //     // If we receive a text message, check to see if it matches a keyword
    //     // and send back the example. Otherwise, just echo the text we received.
    //     switch (messageText) {
    //         case 'generic':
    //             sendGenericMessage(senderID);
    //             break;

    //         default:
    //             sendTextMessage(senderID, messageText);
    //     }
    // } else if (messageAttachments) {
    //     sendTextMessage(senderID, "Message with attachment received");
    // }
}

function sendGenericMessage(recipientId, messageText) {
    // To be expanded in later sections
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: messageText
    };

    callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    console.log(messageData);
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

function ACWCurrentConditions(_senderID) {
    if (locationLUIS.length > 0) {
        acw.CityLookUp(locationLUIS[0])
            .then(function (data) {
                if (data.length > 0) {
                    // always return current conditions for the first key found
                    acw.GetCurrentConditions(data[0].Key)
                        .then(function (data) { currentConditionsMessage(data, _senderID); })
                }
                else {
                    // _res.json(_returnjson);
                }
            })
            .catch(function (err) {
                console.log("ACW Request ERROR => ", err);
                // _res.json(_returnjson);
            })
    } else {
        // _res.json(_returnjson);
    }
}

function ACWForecast12Hours(_senderID) {
    if (locationLUIS.length > 0) {
        acw.CityLookUp(locationLUIS[0])
            .then(function (data) {
                if (data.length > 0) {
                    // always return current conditions for the first key found
                    acw.GetForecastHours(data[0].Key)
                        .then(function (data) { forecastHoursMessage(data, _senderID); })
                }
                else {
                    // _res.json(_returnjson);
                }
            })
            .catch(function (err) {
                console.log("ACW Request ERROR => ", err);
                // _res.json(_returnjson);
            })
    } else {
        // _res.json(_returnjson);
    }
}