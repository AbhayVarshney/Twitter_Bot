let twit = require('twit/lib/twitter');
let config = require('./config.js');
let _ = require('lodash');
const translate = require('google-translate-api');
let Filter = require('bad-words'), filter = new Filter();
filter.removeWords('passed', 'passion');

let bot = new twit(config);
let defaultTheme = "lakers";
let textTheme = defaultTheme;
let myData = [];

//remove @, links, RT
let findTrend = function() {
    bot.get('trends/place', { id: 1 }, function (err, data, resp) {
        // get reference to all trend objects
        let trends = data[0].trends;

        // get all trend names
        let trendNames = _.map(trends, function (trend) {
            return trend.name.toLowerCase();
        });

        textTheme = randIndex(trendNames);
        console.log('Topic of convo: ' + textTheme);

        let myMessage = `Welcome! My name is Abhay and I'm a bot. Today, I am going to talk about ${textTheme}.`;
        bot.post('statuses/update', {
            status: myMessage
        }, function(err, data, response) {
            if(err) return handleError(err);
        });
    });
};

String.prototype.filterMessage = function() {
    let message = this.replace(/\b(?:@|RT|...)\b/ig, '');
    return message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
};

let tweetMessage = function() {
    setInterval(function() {
        let params = {
            q: textTheme,
            since: datestring(),
            result_type: "mixed"
        };

        bot.tweet(params, function(err, reply) {
            if(err) return handleError(err);

            console.log("\nRetweet: retweeted response: " + reply.id);
        });

    }, 12000);
};

twit.prototype.tweet = function (params, callback) {
    let self = this;

    self.get('search/tweets', params, function (err, reply) {
        if(err) return callback(err);

        let tweets = reply.statuses;
        let randomTweet = randIndex(tweets);

        translate(randomTweet.text, {to: 'en'}).then(res => {
            randomTweet.text = res.text.filterMessage();

            myData.push(randomTweet.text);
            if(_.uniq(myData).length === myData.length) {
                randomTweet.text = filter.clean(randomTweet.text);

                self.post('statuses/update', {
                    status: randomTweet.text
                }, function(err, data, response) {
                    if(err) return handleError(err);
                });
            } else {
                myData.pop();
            }
        }).catch(err => {
            handleError(err);
        });
    });
};


function handleError(err) {
    console.error("response status:", err.statusCode);
    console.error("response message:", err.message);
    console.error("data:", err.data);
}

function randIndex (arr) {
    let index = Math.floor(arr.length*Math.random());
    return arr[index];
}

//get date string for today's date (e.g. 2011-01-01)
function datestring () {
    let d = new Date(Date.now() - 5*60*60*1000); //est timezone
    return d.getUTCFullYear() + "-" +
        (d.getUTCMonth() + 1) + "-" +
        d.getDate();
}

botMessage();

function botMessage() {
    findTrend();
    tweetMessage();
}