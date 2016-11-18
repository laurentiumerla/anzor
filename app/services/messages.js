var method = BotMessage.prototype;

//Constructor
function BotMessage() {
    // nothing to do here
}

method.CurrentConditionsMessage = function (_data, _senderID) {

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

    return message;
}

method.ForecastHoursMessage = function (_data, _senderID) {

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

        if (i > 3) { break }

        var element =
            {
                "title": "Classic White T-Shirt",
                "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
                "subtitle": "100% Cotton, 200% Comfortable"
            };

        element.title = "La ora " + h.toString() + ":00 vor fi " + item.Temperature.Value + item.Temperature.Unit;
        if (item.WeatherIcon < 10) {
            element.image_url = "http://developer.accuweather.com/sites/default/files/0" + item.WeatherIcon + "-s.png";
        } else {
            element.image_url = "http://developer.accuweather.com/sites/default/files/" + item.WeatherIcon + "-s.png";
        }

        element.subtitle = item.IconPhrase;

        list.attachment.payload.elements.push(element);
    }
    
    return list;
}

module.exports = BotMessage;