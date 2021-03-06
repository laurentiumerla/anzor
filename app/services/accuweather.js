var method = ACWService.prototype;

//Constructor
function ACWService(_rp) {
    // nothing to do here
    this.rp = _rp;
    this.ACCUWEATHER_API_KEY = "vDabIeXm9GRdW0d0VQ0aYXFacUUJH7KL";
    this.ACCUWEATHER_LANGUAGE = "ro";

    console.log("Accuweather Service Initialized.");
}

method.CityLookUp = function (_q) {
    var _uri = "http://dataservice.accuweather.com/locations/v1/search?q=" +
        encodeURIComponent(_q) + "&apikey=" + this.ACCUWEATHER_API_KEY
        + "&language=" + this.ACCUWEATHER_LANGUAGE
        + "&details=true"
    console.log("ACW Request CALL => ", _uri)
    return this.rp({ uri: _uri, json: true })
}

method.GetCurrentConditions = function (_locationKey) {
    _uri = "http://dataservice.accuweather.com/currentconditions/v1/" +
        _locationKey + 
        ".json?language=" + this.ACCUWEATHER_LANGUAGE + 
        "&apikey=" + this.ACCUWEATHER_API_KEY + 
        "&details=true";
    console.log("ACW Request CALL => ", _uri);
    return this.rp({ uri: _uri, json: true });
}

method.GetForecastHours = function (_locationKey) {
    _uri = "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/" +
        _locationKey + 
        ".json?language=" + this.ACCUWEATHER_LANGUAGE + 
        "&apikey=" + this.ACCUWEATHER_API_KEY + 
        "&details=true&metric=true";
    console.log("ACW Request CALL => ", _uri);
    return this.rp({ uri: _uri, json: true });
}

method.GetForecastDays = function (_locationKey) {
    _uri = "http://dataservice.accuweather.com/forecasts/v1/daily/5day/" +
        _locationKey + 
        ".json?language=" + this.ACCUWEATHER_LANGUAGE + 
        "&apikey=" + this.ACCUWEATHER_API_KEY + 
        "&details=true&metric=true";
    console.log("ACW Request CALL => ", _uri);
    return this.rp({ uri: _uri, json: true });
}

module.exports = ACWService;