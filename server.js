// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var LuisAdapter = require("luis-adapter").LuisAdapter;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

var options = { appId: "cf83bf53-8b33-4d24-8e19-133749db68da", subscriptionKey: "293077c0e3be4f6390b9e3870637905d" };
var query = "cum e vremea in Bucuresti";
var luisAdapter = new LuisAdapter(options);

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    console.log(luisAdapter);
    luisAdapter.Query(query,
        function (data) {
            console.log("Luis thinks this is your intent:" + luisAdapter.GetIntent(data));
            console.log(data);
        },
        function (error) {
            console.log(error);
        });

    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);