// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var rp = require('request-promise');
var request = require('request');
var fs = require('fs');
var GooglePlaces = require('node-googleplaces');
var CFMessage = require('./app/models/chatfuel/message');
var CFVariable = require('./app/models/chatfuel/variable');
var ACWService = require('./app/services/accuweather');
var LUISService = require('./app/services/luis');
var BotMessage = require('./app/services/messages');

var FirebaseService = require('./app/services/firebase');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

//Facebooks tokens
var FACEBOOK_VERIFY_TOKEN = "AnzorWeatherApp2016";
var FACEBOOK_PAGE_ACCESS_TOKEN = "EAACiVL482jQBAMNa9choK9xtIZAkwE0iqZC9RFmfOVPhtfCgzfHq0BuJrACDq8ZCvmgXicCjUpVszrSPzUBS6rLZCUsEGRTm45p84T2CxZCQKzdjdTIjV51QPxxZBludTRVURt19ZBOXrhAUrMtpQxaiEgdZC0myNIivkuCRzI61UwZDZD";

//Services
var acw = new ACWService(rp)
var luis = new LUISService(rp)
var cfm = new CFMessage
var botmsg = new BotMessage
var firebase = new FirebaseService(rp)
var places = new GooglePlaces('AIzaSyDcCuNGe2w0GgzeVKjjcngxuHRUMuid4do')

var senderID, recipientID, timeOfMessage, message, messageId, messageText, messageAttachments

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
                if (event.message && event.message.quick_reply) {
                    receivedQuickReply(event);
                } else if (event.message && event.message.attachments) {
                    receivedAttachment(event);
                    // Handle an attachment from this sender
                } else if (event.message && event.message.text) {
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

setInterval(function () {
    http.get("http://anzor.herokuapp.com");
}, 1500000); // every 5 minutes (300000)

function receivedQuickReply(_event) {
    console.log("Quick Reply received")
    switch (true) {
        case (_event.message.quick_reply.payload.indexOf('UPDATELOCATION_') != -1):
            var location = _event.message.quick_reply.payload.split("_")[1]
            SaveLocation(_event.sender.id, location)
            break
        case (_event.message.quick_reply.payload.indexOf('PROGNOZA_PE_ORE') != -1):
            ProcessGetWeather(_event.sender.id, ["prognoza", "ore"])
            break
        case (_event.message.quick_reply.payload.indexOf('PROGNOZA_PE_ZILE') != -1):
            ProcessGetWeather(_event.sender.id, ["prognoza", "zile"])
            break
    }
}

function receivedAttachment(_event) {
    console.log("Attachment received")
    _event.message.attachments.forEach(function (attachment) {
        switch (attachment.type) {
            case 'location':
                console.log("Location has been received")
                var coordinates = attachment.payload.coordinates.lat + ',' + attachment.payload.coordinates.long
                console.log(coordinates)
                places.nearbySearch({ location: coordinates, radius: 1, language: 'ro' }).then((res) => {
                    var location = res.body.results[0].name
                    console.log(location)
                    sendGenericMessage(senderID, botmsg.ConfirmLocationMessage({ formatted_address: location, name: location }))
                })
                firebase.WriteToUser(senderID, { lastAction: "" })
                break
            case 'image':
                break
            case 'audio':
                break
            case 'file':
                break
        }
    })

}

function receivedPayload(event) {
    senderID = event.sender.id
    recipientID = event.recipient.id
    timeOfMessage = event.timestamp
    payload = event.postback.payload
    // var p = JSON.parse(payload);

    console.log("Received payload for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage)
    console.log(JSON.stringify(payload))

    switch (true) {
        case (payload.indexOf('FORECASTHOURSMORE_') != -1):
            var fromCounter = payload.split("_")[1]
            var location = payload.split("_")[2]

            // Call function to get more information about the product
            ACWForecast12Hours(senderID, location, fromCounter)
            break

        case (payload.indexOf('FORECASTDAYSMORE_') != -1):
            var fromCounter = payload.split("_")[1]
            var location = payload.split("_")[2]

            // Call function to get more information about the product
            ACWForecast5Days(senderID, location, fromCounter)
            break

        case (payload.indexOf('SETTINGSLOCATION') != -1):
            firebase.WriteToUser(senderID, { lastAction: "CHANGELOCATION" })
            sendGenericMessage(senderID, botmsg.ChangeLocationMessage())
            break

        case (payload.indexOf('SETTINGSNOTIFICATIONS') != -1):
            firebase.ReadUserData(senderID).then(function (snapshot) {
                var activeNotifications = snapshot.val().notifications
                // console.log('activeNotifications: ', activeNotifications)
                firebase.ReadNotifications().then(function (_notifications) {
                    // sendGenericMessage(senderID, botmsg.MainMenuNotificationsMessage(_notifications.val(), activeNotifications))
                    console.log('_notifications.val(): ', _notifications)
                    botmsg.MainMenuNotificationsMessage(_notifications.val(), activeNotifications)
                })

            })
            // sendGenericMessage(senderID, botmsg.MainMenuNotificationsMessage())
            break

        case (payload.indexOf('SETTINGSALL') != -1):
            firebase.ReadUserData(senderID).then(function (snapshot) {
                var location = snapshot.val().location
                if (!location) location = 'Nu este setata'
                sendGenericMessage(senderID, botmsg.AllSettingsGenericMessage(location))
            })
            break

        case (payload.indexOf('GETWEATHER_') != -1):
            var location = payload.split("_")[1]
            ProcessGetWeather(senderID, ["vremea"], location)
            break



    }
}

function receivedMessage(_event) {
    senderID = _event.sender.id
    recipientID = _event.recipient.id
    timeOfMessage = _event.timestamp
    message = _event.message
    messageId = message.mid
    messageText = message.text
    messageAttachments = message.attachments

    console.log("Received message for user %d and page %d at %d with message:",
        _event.sender.id, _event.recipient.id, _event.timestamp)
    console.log(JSON.stringify(_event.message))

    firebase.WriteUserData(_event.sender.id, _event.recipient.id)
    firebase.WriteUserMessage(_event.sender.id, _event.message.text, _event.timestamp)

    //Process quick reply
    // if (_event.message.quick_reply) {
    //     switch (true) {
    //         case (_event.message.quick_reply.payload.indexOf('UPDATELOCATION_') != -1):
    //             var location = _event.message.quick_reply.payload.split("_")[1]
    //             SaveLocation(senderID, location)
    //             break
    //     }
    // } else {
    //Process last action first
    var userData = {}
    firebase.ReadUserData(_event.sender.id).then(function (snapshot) {
        lastAction = snapshot.val().lastAction
        userData = snapshot.val()

        if (lastAction) {
            switch (lastAction) {
                case 'CHANGELOCATION':
                    console.log('CHANGELOCATION')
                    places.textSearch({ query: _event.message.text, language: 'ro' }).then((res) => {
                        var location = res.body.results[0]
                        sendGenericMessage(senderID, botmsg.ConfirmLocationMessage(location))
                    })
                    break
            }
            firebase.WriteToUser(senderID, { lastAction: "" })
            return
        } else {
            // Process message with LUIS
            luis.AskLUIS(_event.message.text.substring(0, 100))
                .then(function (data) {
                    luis.SetData(data)
                    switch (luis.GetIntentFirst().intent) {
                        case ("GetHelp"):
                            ProcessGetHelp(_event.sender.id, userData.location.name)
                            break

                        case ("GetWeather"):
                            ProcessGetWeather(_event.sender.id, luis.GetEntities("Subject"), luis.GetEntities("Location")[0])
                            break

                        default:
                            // No Intent found
                            break;
                    }
                })
                .catch(function (err) {
                    // API call failed... 
                    console.log(err)
                });
        }
    })
    // }
}

function sendGenericMessage(_recipientId, _messageText) {
    // To be expanded in later sections
    var messageData = {
        recipient: {
            id: _recipientId
        },
        message: _messageText
    };

    callSendAPI(messageData);
}

function sendTextMessage(_recipientId, _messageText) {
    var messageData = {
        recipient: {
            id: _recipientId
        },
        message: {
            text: _messageText
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

function ProcessGetHelp(_senderID, _location) {
    sendTextMessage(_senderID, botmsg.HelpTextMessage(_location));
    sendGenericMessage(_senderID, botmsg.HelpGenericMessage(_location));
}

function ProcessGetWeather(_senderID, _subjectList, _location) {

    userSnapshot = firebase.ReadUserData(_senderID).then(function (snapshot) {
        userlocation = snapshot.val().location.name;
        if (!_location)
            //Ask for location
            if (!userlocation) {
                //Ask for location
                firebase.WriteToUser(senderID, { lastAction: "CHANGELOCATION" })
                sendGenericMessage(_senderID, botmsg.AskLocationMessage());
            }
            else
                GetWeatherForLocation(_senderID, _subjectList, userlocation)
        else {
            // places.textSearch({ query: _location, language: 'ro' }).then((res) => {
            //     firebase.WriteUserLocation(senderID, res.body)
            // })
            GetWeatherForLocation(_senderID, _subjectList, _location)
        }
    })
}

function GetWeatherForLocation(_senderID, _subjectList, _location) {
    switch (true) {
        case (_subjectList.indexOf("vremea") != -1):
            ACWCurrentConditions(_senderID, _location);
            break;
        case (_subjectList.indexOf("prognoza") != -1):
            switch (true) {
                case (_subjectList.indexOf("ore") != -1):
                    ACWForecast12Hours(_senderID, _location, 0);
                    break;
                case (_subjectList.indexOf("zile") != -1):
                    ACWForecast5Days(_senderID, _location, 0);
                    break;
            }
            break;
        default:
            ACWCurrentConditions(_senderID, _location);
            break
    }
}

function ACWCurrentConditions(_senderID, _location) {
    acw.CityLookUp(_location)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                acw.GetCurrentConditions(data[0].Key)
                    .then(function (data) {
                        sendGenericMessage(_senderID, botmsg.CurrentConditionsMessage(data, _location));
                    })
            }
            else {
                console.log("ACW: No location found ACWCurrentConditions")
            }
        })
        .catch(function (err) {
            console.log("ACW: Request ERROR => ", err);
        })
}

function ACWForecast12Hours(_senderID, _location, _fromCounter) {
    acw.CityLookUp(_location)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                acw.GetForecastHours(data[0].Key)
                    .then(function (data) {
                        places.textSearch({ query: _location, language: 'ro' }).then((res) => {
                            var location = res.body.results[0]
                            sendGenericMessage(_senderID, botmsg.ForecastHoursMessage(data, _senderID, location, _fromCounter));
                        })
                    })
            }
            else {
                console.log("ACW: No location found for ACWForecast12Hours")
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
                        places.textSearch({ query: _location, language: 'ro' }).then((res) => {
                            var location = res.body.results[0]
                            sendGenericMessage(_senderID, botmsg.ForecastDaysMessage(data, _senderID, location, _fromCounter));
                        })
                    })
            }
            else {
                console.log("ACW: No location found for ACWForecast5Days")
            }
        })
        .catch(function (err) {
            console.log("ACW Request ERROR => ", err);
        })
}

function SaveLocation(_senderId, _text) {
    places.textSearch({ query: _text, language: 'ro' }).then((res) => {
        var location = res.body.results[0]
        firebase.WriteUserLocation(_senderId, location)
        sendTextMessage(_senderId, "Super, o să-ți trimit vremea pentru " + location.formatted_address + ".")
    })
}