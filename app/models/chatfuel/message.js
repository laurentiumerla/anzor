var method = CFMessage.prototype;

function CFMessage() {
    // nothing to do here
}

// text message
method.text = function () {
    var obj = {
        text: "message text"
    }
    return obj;
}

// video message
method.video = function () {
    var obj = {
        "attachment": {
            "type": "video",
            "payload": {
                "url": "https://petersapparel.parseapp.com/img/item101-video.mp4"
            }
        }
    }
    return obj;
}

//image message
method.image = function () {
    var obj = {
        "attachment": {
            "type": "image",
            "payload": {
                "url": "https://petersapparel.parseapp.com/img/item101-thumb.png"
            }
        }
    }
    return obj;
}

// card with 2 buttons
method.card2buttons = function () {
    var obj = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Hello!",
                "buttons": [
                    {
                        "type": "show_block",
                        "block_name": "some block name",
                        "title": "Show the block!"
                    },
                    {
                        "type": "web_url",
                        "url": "https://petersapparel.parseapp.com/buy_item?item_id=100",
                        "title": "Buy Item"
                    }
                ]
            }
        }
    }
    return obj;
}

//gallery message
method.gallery = function () {
    var obj = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Classic White T-Shirt",
                        "image_url": "http://petersapparel.parseapp.com/img/item100-thumb.png",
                        "subtitle": "Soft white cotton t-shirt is back in style",
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": "https://petersapparel.parseapp.com/view_item?item_id=100",
                                "title": "View Item"
                            },
                            {
                                "type": "web_url",
                                "url": "https://petersapparel.parseapp.com/buy_item?item_id=100",
                                "title": "Buy Item"
                            }
                        ]
                    },
                    {
                        "title": "Classic Grey T-Shirt",
                        "image_url": "http://petersapparel.parseapp.com/img/item101-thumb.png",
                        "subtitle": "Soft gray cotton t-shirt is back in style",
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": "https://petersapparel.parseapp.com/view_item?item_id=101",
                                "title": "View Item"
                            },
                            {
                                "type": "web_url",
                                "url": "https://petersapparel.parseapp.com/buy_item?item_id=101",
                                "title": "Buy Item"
                            }
                        ]
                    }
                ]
            }
        }
    }
    return obj;
}

module.exports = CFMessage;