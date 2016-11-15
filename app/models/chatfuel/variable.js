var method = CFVariable.prototype;

function CFVariable() {
    // nothing to do here
}

method.setVariables = function () {
    var obj = {
        "some variable": "some value",
        "another variable": "another value"
    }
    return obj;
}

module.exports = CFMessage;