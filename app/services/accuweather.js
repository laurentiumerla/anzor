var method = ACWService.prototype;

//Constructor
function ACWService(_rp) {
    // nothing to do here
    this.rp = _rp;
}

method.ACCUWEATHER_API_KEY = "hoArfRosT1215";
method.ACCUWEATHER_LANGUAGE = "ro";

method.CityLookUp = function (_q) {
    var _uri = "http://apidev.accuweather.com/locations/v1/search?q=" +
        _q + "&apikey=" + method.ACCUWEATHER_API_KEY;
    console.log("ACW Request CALL => ", _uri);
    return this.rp({ uri: _uri, json: true });
}

method.GetCurrentConditions = function (_locationKey) {
    _uri = "http://apidev.accuweather.com/currentconditions/v1/" +
        _locationKey + ".json?language=" + method.ACCUWEATHER_LANGUAGE + "&apikey=" + method.ACCUWEATHER_API_KEY;
    console.log("ACW Request CALL => ", _uri);
    return this.rp({ uri: _uri, json: true });
}

module.exports = ACWService;