let twit = require('twit/lib/twitter');
let config = require('./config.js');

let Twitter = new twit(config);

let messages = ["Hello World!", "How is your Day", "Did you know I am a robot?"];
let messageLocation = 0;

// Load your image
let data = require('fs').readFileSync('./my_images/image1.png', { encoding: 'base64' });

let writeTweet = function() {
    Twitter.post('statuses/update', {
        status: messages[messageLocation]
    }, function(err, data, response) {
        console.log(data)
    });
    messageLocation += 1;
};

// Make post request on media endpoint. Pass rotated.txt data as media parameter
let postMedia = function() {
    Twitter.post('media/upload', {
        media_data: data
    }, function(error, data, response) {
        console.log(data);

        let mediaIdStr = data.media_id_string;
        let altText = "simple image scu";

        Twitter.post('media/metadata/create', {
            media_id: mediaIdStr,
            alt_text: { text: altText }
        }, function (err, data, response) {
            if (!err) {
                // now we can reference the media and post a tweet (media will attach to the tweet)
                let params = { status: 'posting picture... #scu', media_ids: [mediaIdStr] };

                Twitter.post('statuses/update', params, function (err, data, response) {
                    console.log(data)
                })
            }
        })
    });
};

postMedia();

writeTweet();
setInterval(writeTweet, 5000);