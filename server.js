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
var LUISService = require('./app/services/luis');
var BotMessage = require('./app/services/messages');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

var FACEBOOK_VERIFY_TOKEN = "AnzorWeatherApp2016";
var FACEBOOK_PAGE_ACCESS_TOKEN = "EAACiVL482jQBAMNa9choK9xtIZAkwE0iqZC9RFmfOVPhtfCgzfHq0BuJrACDq8ZCvmgXicCjUpVszrSPzUBS6rLZCUsEGRTm45p84T2CxZCQKzdjdTIjV51QPxxZBludTRVURt19ZBOXrhAUrMtpQxaiEgdZC0myNIivkuCRzI61UwZDZD";
var locationLUIS = [], subjectLUIS = [], intent;
var acw = new ACWService(rp);
var luis = new LUISService(rp);
var cfm = new CFMessage;
var botmsg = new BotMessage;

var senderID, recipientID, timeOfMessage, message, messageId, messageText, messageAttachments;

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
                if (event.message && event.message.text) {
                    receivedMessage(event);
                    // Handle a text message from this sender
                } else if (event.postback && event.postback.payload) {
                    receivedPayload(event);
                    // Handle a payload from this sender
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

function receivedPayload(event) {
    senderID = event.sender.id;
    recipientID = event.recipient.id;
    timeOfMessage = event.timestamp;
    payload = event.postback.payload;
    // var p = JSON.parse(payload);

    console.log("Received payload for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(payload));

    switch (true) {
        case (payload.indexOf('FORECASTHOURSMORE_') != -1):
            var fromCounter = payload.split("_")[1];
            var location = payload.split("_")[2];

            // Call function to get more information about the product
            ACWForecast12Hours(senderID, location, fromCounter);
            break;

        case (payload.indexOf('FORECASTDAYSMORE_') != -1):
            var fromCounter = payload.split("_")[1];
            var location = payload.split("_")[2];

            // Call function to get more information about the product
            ACWForecast5Days(senderID, location, fromCounter);
            break;
    }

    // if (payload.indexOf('FORECASTHOURSMORE_') > -1) {
    //     var fromCounter = payload.split("_")[1];
    //     var location = payload.split("_")[2];

    //     // Call function to get more information about the product
    //     ACWForecast12Hours(senderID, location, fromCounter);
    // }

}

function receivedMessage(event) {
    senderID = event.sender.id;
    recipientID = event.recipient.id;
    timeOfMessage = event.timestamp;
    message = event.message;
    messageId = message.mid;
    messageText = message.text;
    messageAttachments = message.attachments;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    // Process message with LUIS
    luis.AskLUIS(messageText)
        .then(function (data) {
            luis.SetData(data);
            subjectLUIS = luis.GetEntities("Subject");
            locationLUIS = luis.GetEntities("Location");
            intent = luis.GetIntentFirst();

            switch (intent.intent) {
                case ("GetHelp"):
                    ProcessGetHelp();
                    break;
                case ("GetWeather"):
                    ProcessGetWeather();
                    break;
            }
        })
        .catch(function (err) {
            // API call failed... 
            console.log(err);
        });

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

function ProcessGetHelp() {

}

function ProcessGetWeather() {
    switch (true) {
        case (subjectLUIS.indexOf("vremea") != -1):
            ACWCurrentConditions(senderID, locationLUIS[0]);
            break;
        case (subjectLUIS.indexOf("prognoza") != -1):
            switch (true) {
                case (subjectLUIS.indexOf("ore") != -1):
                    ACWForecast12Hours(senderID, locationLUIS[0], 0);
                    break;
                case (subjectLUIS.indexOf("zile") != -1):
                    ACWForecast5Days(senderID, locationLUIS[0], 0);
                    break;
            }
            break;
    }
}

function ACWCurrentConditions(_senderID, _location) {
    acw.CityLookUp(_location)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                acw.GetCurrentConditions(data[0].Key)
                    .then(function (data) {
                        sendGenericMessage(_senderID, botmsg.CurrentConditionsMessage(data, _senderID, _location));
                    })
            }
            else {
            }
        })
        .catch(function (err) {
            console.log("ACW Request ERROR => ", err);
        })
}

function ACWForecast12Hours(_senderID, _location, _fromCounter) {
    acw.CityLookUp(_location)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                acw.GetForecastHours(data[0].Key)
                    .then(function (data) {
                        sendGenericMessage(_senderID, botmsg.ForecastHoursMessage(data, _senderID, _location, _fromCounter));
                    })
            }
            else {
            }
        })
        .catch(function (err) {
            console.log("ACW Request ERROR => ", err);
        })
}

function ACWForecast5Days(_senderID, _location, _fromCounter) {
    acw.CityLookUp(_location)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                acw.GetForecastDays(data[0].Key)
                    .then(function (data) {
                        sendGenericMessage(_senderID, botmsg.ForecastDaysMessage(data, _senderID, _location, _fromCounter));
                    })
            }
            else {
            }
        })
        .catch(function (err) {
            console.log("ACW Request ERROR => ", err);
        })
}