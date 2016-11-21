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

    this.db = firebase.database();

    console.log("Firebase Service Initialized.");
    console.log(this.fbs);
}

method.WriteUserData = function (_userId, _pageId, _name, _location) {
    var values;

    if (!_userId) { console.log("Please specify userId to writeUserMessage") }

    if (_name) { values.name = _name; }
    if (_pageId) { values.pageId = _pageId; }
    if (_location) { values.location = _location; }

    // firebase.database().ref('users/' + _userId).set({
    //     name: _name,
    //     pageId: _pageId,
    //     location: _location
    // });
    if (values) { firebase.database().ref('users/' + _userId).set(values); }
}

method.WriteUserMessage = function (_userId, _message, _timestamp) {
    var values;

    if (!_userId) { console.log("Please specify userId to writeUserMessage") }

    if (_message) { values._message = _message; }
    if (_timestamp) { values._timestamp = _timestamp; }

    // firebase.database().ref('users/' + _userId + /messages/).set({
    //     message: _message,
    //     timestamp: _timestamp
    // });
    if (values) { firebase.database().ref('users/' + _userId + /messages/).set(values); }
}

module.exports = FirebaseService;