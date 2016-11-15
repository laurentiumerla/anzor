// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var rp = require('request-promise');

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

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
router.route('/acw_location')
    .get(function (req, res) {
        console.log("Request: ", req)
        var options = {
            uri: 'https://api.projectoxford.ai/luis/v2.0/apps/' +
            LUIS_APP_ID + '?subscription-key=' +
            LUIS_SUBSCRIPTION_KEY + '&q=cum%20e%20vremea%20in%20bucuresti&timezoneOffset=0.0',
            json: true // Automatically parses the JSON string in the response 
        };
        console.log(options);
        rp(options)
            .then(function (data) {
                console.log(data);

                for (var i = 0, len = data.entities.length; i < len; i++) {
                    switch (data.entities[i].type) {
                        case "Location":
                            res.json({ message: data.entities[i].entity });
                            break;
                        case "Subject":
                            break;
                        default:
                    }
                }

            })
            .catch(function (err) {
                // API call failed... 
                console.log(err);
            });
    })

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);