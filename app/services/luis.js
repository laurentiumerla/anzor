var method = LUISService.prototype;

//Constructor
function LUISService(_rp) {
    // nothing to do here
    this.rp = _rp;
    this.LUIS_APP_ID = "cf83bf53-8b33-4d24-8e19-133749db68da";
    this.LUIS_SUBSCRIPTION_KEY = "293077c0e3be4f6390b9e3870637905d";
}

method.AskLUIS = function (query) {
    var LUIS_EXTRACT_OPTIONS = {
        uri: 'https://api.projectoxford.ai/luis/v2.0/apps/' +
        this.LUIS_APP_ID + '?subscription-key=' +
        this.LUIS_SUBSCRIPTION_KEY + '&q=' + query + '&timezoneOffset=0.0',
        json: true // Automatically parses the JSON string in the response 
    };

    return httprp(LUIS_EXTRACT_OPTIONS)
}

method.Httprp = function (_opt) {
    console.log("Request CALL => ", _opt.uri);
    return rp(_opt);
}

method.ExtractEntitiesFromLuis = function (_data) {
    this.data = _data;

    locationLUIS = [];
    subjectLUIS = [];

    for (var i = 0, len = this.data.entities.length; i < len; i++) {
        switch (this.data.entities[i].type) {
            case "Location":
                locationLUIS.push(this.data.entities[i].entity);
                break;
            case "Subject":
                subjectLUIS.push(this.data.entities[i].entity);
                break;
        }
    }
}

method.GetEntityFirst = function (_entityType) {
    var entity = [];
    for (var i = 0, len = this.data.entities.length; i < len; i++) {
        if (this.data.entities[i].type = _entityType) {
            return this.data.entities[i].entity;
        }
    }
    return entity;
}

method.GetEntities = function (_entityType) {
    var entityList = [];
    for (var i = 0, len = this.data.entities.length; i < len; i++) {
        switch (this.data.entities[i].type) {
            case _entityType:
                entityList.push(this.data.entities[i].entity);
                break;
        }
        return entityList;
    }
}

module.exports = LUISService;