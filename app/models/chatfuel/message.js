var method = CFMessage.prototype;

function CFMessage(){

}

method.text = function(){
    var text = {
        text: String
    }
    return text;
}

module.exports = CFMessage;