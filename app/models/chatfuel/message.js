var method = CFMessage.prototype;

function CFMessage() {
    // TO DO
}

// Simple text message
method.text = { "text": "message text" };

// video message
method.video = {
    "attachment": {
        "type": "video",
        "payload": {
            "url": "https://petersapparel.parseapp.com/img/item101-video.mp4"
        }
    }
}

//image message
method.image = {
    "attachment": {
        "type": "image",
        "payload": {
            "url": "https://petersapparel.parseapp.com/img/item101-thumb.png"
        }
    }
}

// card with 2 buttons
method.card2buttons = {
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

// button message
method.button = {
    "type": "web_url",
    "url": "https://petersfancyapparel.com/classic_white_tshirt",
    "title": "View Item"
}

method.quickReply = {
    "text": "testRedirectInQuickReply",
    "quick_replies": []
}

//gallery message
method.gallery = {
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

module.exports = CFMessage;