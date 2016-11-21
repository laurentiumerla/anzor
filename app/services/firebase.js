var firebase = require('firebase');

var method = FirebaseService.prototype;

//Constructor
function FirebaseService(_rp) {
    this.rp = _rp;

    this.fbs = firebase.initializeApp({
        apiKey: "AIzaSyB4t2HHjciU2SKLJjF7XBZOONw22EGlTkA",
        authDomain: "anzor-e03cf.firebaseapp.com",
        databaseURL: "https://anzor-e03cf.firebaseio.com",
        storageBucket: "anzor-e03cf.appspot.com",
        messagingSenderId: "287523288248"
    });

    this.db = this.fbs.database();

    this.fbs.auth().signInAnonymously().catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(error);
    });

    console.log("Firebase Service Initialized.");
}

method.WriteUserData = function (_userId, _pageId, _name, _location) {
    var values = {};

    if (!_userId) { console.log("Please specify userId to WriteUserData") }

    if (_name) { values.name = _name; }
    if (_pageId) { values.pageId = _pageId; }
    if (_location) { values.location = _location; }

    if (values) { this.fbs.database().ref('users/' + _userId).update(values); }
}

method.WriteUserLocation = function (_userId, _location) {
    var values = {};

    if (!_userId) { console.log("Please specify userId to WriteUserLocation") }

    var userRef = firebase.database().ref('/users/' + _userId);

    userRef.once('value').then(function (snapshot) {
        var location = snapshot.val().location;
        console.log("Snapshot: ", location);
        if (!location) {
            console.log("Location not found then update Firebase with", _location);
            if (_location) { values.location = _location; }
            console.log("Values: ", values);
            console.log("UserId: ", _userId);

            var updates = {};
            updates['/users/' + _userId] = values;

            if (values) { this.fbs.database().ref().update(updates); }
        }
    })
}

method.ReadUserData = function (_userId) {

    if (!_userId) { console.log("Please specify userId to ReadUserData") }

    var userRef = firebase.database().ref('/users/' + _userId);

    userRef.once('value').then(function (snapshot) {
        return snapshot.val();
    })
}

method.WriteUserMessage = function (_userId, _message, _timestamp) {
    var values = {};

    if (!_userId) { console.log("Please specify userId to WriteUserMessage") }

    if (_message) { values.message = _message; }
    if (_timestamp) { values.timestamp = _timestamp; }

    // Get a key for a new Post.
    var newMessageKey = firebase.database().ref('users/' + _userId).child('messages').push().key;

    var updates = {};
    updates['/messages/' + newMessageKey] = values;

    if (values) { this.fbs.database().ref('users/' + _userId).update(updates); }
}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

module.exports = FirebaseService;