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

    console.log("Firebase Service Initialized.");
    console.log(fbs);
}

module.exports = FirebaseService;