var method = BotMessage.prototype;

//Constructor
function BotMessage() {
    // nothing to do here
}

method.CurrentConditionsMessage = function (_data, _senderID, _location) {

    var message = { "text": "", "quick_replies": [] }

    message.text = 'In ' + _location + ' sunt ' +
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

method.ForecastDaysMessage = function (_data, _senderID, _location, _fromCounter) {

    var listArray = [];
    // var addListToArray = false;
    var counter = 0;

    var list = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "list",
                "top_element_style": "compact",
                "elements": [],
                "buttons": []
            }
        }
    }

    //  Main header Item
    // var mainItem_image_url = "";
    // if (_data.WeatherIcon < 10) {
    //     mainItem_image_url = "http://developer.accuweather.com/sites/default/files/0" + _data.WeatherIcon + "-s.png";
    // } else {
    //     mainItem_image_url = "http://developer.accuweather.com/sites/default/files/" + _data.WeatherIcon + "-s.png";
    // }

    // list.attachment.payload.elements.push(
    //     {
    //         "title": "Prognoza pe ore in " + _location,
    //         "image_url": mainItem_image_url,
    //         "subtitle": _data.IconPhrase,
    //     }
    // );

    // Always display 4 items => _fromCounter + 4
    for (var i = _fromCounter, len = _data.DailyForecasts.length; i < len; i++) {
        var item = _data.DailyForecasts[i];
        var d = new Date(item.Date);
        var h = d.getHours();
        counter++;

        if (counter > 4) {
            break;
        }

        var element =
            {
                "title": "Classic White T-Shirt",
                "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
                "subtitle": "100% Cotton, 200% Comfortable"
            };

        element.title = d.getDate().toString() + "/" + d.getMonth().toString() + "/" + d.getYear().toString() + "  " + item.Temperature.Minimum.Value + "°/" + item.Temperature.Maximum.Value + "°";// + item.Temperature.Unit;
        if (item.Day.Icon < 10) {
            element.image_url = "http://developer.accuweather.com/sites/default/files/0" + item.Day.Icon + "-s.png";
        } else {
            element.image_url = "http://developer.accuweather.com/sites/default/files/" + item.Day.Icon + "-s.png";
        }

        element.subtitle = item.Day.IconPhrase;

        list.attachment.payload.elements.push(element);
        _fromCounter++;
    }

    if (_fromCounter < _data.DailyForecasts.length) {
        list.attachment.payload.buttons.push(
            {
                "title": "Mai mult",
                "type": "postback",
                "payload": "FORECASTDAYSMORE_" + _fromCounter.toString() + "_" + _location.name
            }
        );
    }

    return list;
}

method.ForecastHoursMessage = function (_data, _senderID, _location, _fromCounter) {

    var listArray = [];
    // var addListToArray = false;
    var counter = 0;

    var list = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "list",
                // "top_element_style": "compact",
                "elements": [],
                "buttons": []
            }
        }
    }

    //  Main header Item
    var mainItem_image_url = "";
    // if (_data.WeatherIcon < 10) {
    //     mainItem_image_url = "http://developer.accuweather.com/sites/default/files/0" + _data.WeatherIcon + "-s.png";
    // } else {
    //     mainItem_image_url = "http://developer.accuweather.com/sites/default/files/" + _data.WeatherIcon + "-s.png";
    // }

    mainItem_image_url = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="
        + _location.photos[0].photo_reference
        + "&key=AIzaSyDcCuNGe2w0GgzeVKjjcngxuHRUMuid4do"

    list.attachment.payload.elements.push(
        {
            // "title": "Prognoza pe ore in " + _location.name,
            "title": _location.formatted_address.toUpperCase(),
            "image_url": mainItem_image_url,
            "subtitle": _data.IconPhrase,
        }
    );

    // Always display 3 items => _fromCounter + 3
    for (var i = _fromCounter, len = _data.length; i < len; i++) {
        var item = _data[i];
        var d = new Date(item.DateTime);
        var h = d.getHours();
        counter++;

        if (counter > 3) {
            break;
        }

        var element =
            {
                "title": "Classic White T-Shirt",
                "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
                "subtitle": "100% Cotton, 200% Comfortable"
            };

        element.title = "La ora " + h.toString() + ":00 vor fi " + item.Temperature.Value + "°";// + item.Temperature.Unit;
        if (item.WeatherIcon < 10) {
            element.image_url = "http://developer.accuweather.com/sites/default/files/0" + item.WeatherIcon + "-s.png";
        } else {
            element.image_url = "http://developer.accuweather.com/sites/default/files/" + item.WeatherIcon + "-s.png";
        }

        element.subtitle = item.IconPhrase;

        list.attachment.payload.elements.push(element);
        _fromCounter++;
    }

    console.log("FromCounter/DataLength: ", _fromCounter, "/", _data.length);
    if (_fromCounter < _data.length) {
        list.attachment.payload.buttons.push(
            {
                "title": "Mai mult",
                "type": "postback",
                "payload": "FORECASTHOURSMORE_" + _fromCounter.toString() + "_" + _location.name
            }
        );
    }

    return list;
}

method.ChangeLocationMessage = function () {
    var text = {
        "text": "Sigur. Spune-mi care dorești sa fie locația. Un nume de oraș te rog!",
        "quick_replies": [
            {
                "content_type": "location",
            }
        ]
    }
    return text;
}

method.AskLocationMessage = function () {
    var text = {
        "text": "De ce nu-mi spui unde ești? Trebuie să știu pentru putea da prognoza. Dacă ești pe telefon, poți să-mi trimiti locația.",
        "quick_replies": [
            {
                "content_type": "location",
            }
        ]
    }
    return text;
}

method.ConfirmLocationMessage = function (_location) {
    var text = {
        "text": "Bine! " + _location.formatted_address + "? Este corect?",
        "quick_replies": [
            {
                "content_type": "text",
                "title": "Da",
                "payload": "CHANGELOCATION_" + _location.name
            },
            {
                "content_type": "text",
                "title": "Nu",
                "payload": "CHANGELOCATION_" + _location.name
            }
        ]
    }
    return text;
}

method.HelpTextMessage = function (_location) {
    var text = "Bună. Eu pot să-ți spun vremea ... printre altele. Spune-mi lucruri cum ar fi următoarele:\n\n" +
        "     • Vremea\n" +
        "     • Ninge in " + _location + "?\n" +
        "     • Am nevoie de o umbrelă azi?\n" +
        "     • Care este prognoza pentru urmatoarele 5 zile?\n" +
        "     • Oprește notificările!\n" +
        "     • Schimbă setările"
        ;

    return text;
}

method.HelpGenericMessage = function (_location) {
    var genericMessage = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Vremea",
                        "subtitle": "Prognoza făcută doar pentru tine.",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Vremea",
                                "payload": "GETWEATHER_" + _location
                            },
                            {
                                "type": "postback",
                                "title": "Prognoza pe ore",
                                "payload": "FORECASTHOURSMORE_0_" + _location
                            },
                            {
                                "type": "postback",
                                "title": "Prognoza pe 5 zile",
                                "payload": "FORECASTDAYSMORE_0_" + _location
                            }
                        ]
                    },
                    {
                        "title": "Setări",
                        "subtitle": "Adaugă locația, modifică notificările și alte lucruri.",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Schimbă locația.",
                                "payload": "SETTINGSLOCATION"
                            },
                            {
                                "type": "postback",
                                "title": "Notificări",
                                "payload": "SETTINGSNOTIFICATIONS"
                            },
                            {
                                "type": "postback",
                                "title": "Toate setările",
                                "payload": "SETTINGSALL"
                            }
                        ]
                    }
                ]
            }
        }
    }

    return genericMessage;
}

method.AllSettingsGenericMessage = function (_location) {

    var text =
        "Aici sunt setările:\n"
        + "Locația: " + _location.name
        + "\nNotificări active: Nici una"
        + "\nNotificări inactive: Prognoze"

    var genericMessage = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": text,
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Schimbă locația.",
                        "payload": "SETTINGSLOCATION"
                    },
                    {
                        "type": "postback",
                        "title": "Notificări",
                        "payload": "SETTINGSNOTIFICATIONS"
                    }
                ]
            }
        }
    }

    return genericMessage;
}

method.HTMLMessage = function () {
    var htmlTableBegin =
        "<style type='text/css'>"
        + ".tg  {border-collapse:collapse;border-spacing:0;}"
        + ".tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}"
        + ".tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}"
        + ".tg .tg-mtwr{background-color:#bbdaff;vertical-align:top}"
        + ".tg .tg-4hfa{background-color:#fffe65;vertical-align:top}"
        + ".tg .tg-yw4l{vertical-align:top}"
        + "</style>"
        + "<table class='tg'>"

    var htmlTableRow =
        "<tr>"
        + "<td class='tg-4hfa'></td>"
        + "<td class='tg-yw4l'></td>"
        + "<td class='tg-mtwr'></td>"
        + "</tr>"

    var htmlTableClose = "</table>"

    return htmlTableBegin + htmlTableRow + htmlTableRow + htmlTableRow + htmlTableClose

}

method.Image = function (_url) {
    var image = {
        "attachment": {
            "type": "image",
            "payload": {
                "url": _url
            }
        }
    }

    return image
}




module.exports = BotMessage;