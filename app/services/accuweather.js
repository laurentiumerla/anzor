var method = ACWService.prototype;

//Constructor
function ACWService() {
    // nothing to do here
}

method.ACCUWEATHER_API_KEY = "hoArfRosT1215";
method.ACCUWEATHER_LANGUAGE = "ro";

method.CityLookUp = function (_rp, _q) {
    var _uri = "http://apidev.accuweather.com/locations/v1/search?q=" +
        _q + "&apikey=" + method.ACCUWEATHER_API_KEY;
    console.log("ACW Request CALL => ", _uri);
    return _rp({ uri: _uri, json: true });
}

method.GetCurrentConditionsByKey = function (_rp, _locationKey) {
    _uri = "http://apidev.accuweather.com/currentconditions/v1/" +
        __locationKey + ".json?language=" + method.ACCUWEATHER_LANGUAGE + "&apikey=" + method.ACCUWEATHER_API_KEY;
    console.log("ACW Request CALL => ", _uri);
    return _rp({ uri: _uri, json: true });
}

method.GetCurrentConditions = function (_rp, _q) {
    // _uri = "http://apidev.accuweather.com/currentconditions/v1/" +
    //     __locationKey + ".json?language=" + method.ACCUWEATHER_LANGUAGE + "&apikey=" + method.ACCUWEATHER_API_KEY;
    // console.log("ACW Request CALL => ", _uri);
    // return _rp({ uri: _uri, json: true });

    method.CityLookUp(_rp, _q)
        .then(function (data) {
            if (data.length > 0) {
                // always return current conditions for the first key found
                return method.GetCurrentConditionsByKey(data[0].Key)
            }
            else {
                return null;
            }
        })
        .catch(function (err) {
            console.log("ACW Request ERROR => ", err);
            return null;
        })
}

module.exports = ACWService;