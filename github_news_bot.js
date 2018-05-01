// libraries
let MarkovChain = require('libmarkov');
let Wiki = require("wikipedia-js");
let HtmlToText = require('html-to-text');
let twit = require('twit/lib/twitter');
let config = require('./config.js'), bot = new twit(config);
let _ = require('lodash');
let GoogleTranslate = require('google-translate-api');
let Filter = require('bad-words'), filter = new Filter();
let BlueBird = require('bluebird');

// configs/variables
filter.removeWords('passed', 'passion');
let textTheme = "lakers"; // default
let myData = [];

let findTrend = function() {
    return new Promise(function(resolve) {
        setTimeout(() => resolve(1), 1000);
    }).then(() => {
        return bot.get('trends/place', { id: 1 }, function (err, data, resp) {
            // get reference to all trend objects
            let trends = data[0].trends;

            // get all trend names
            let trendNames = _.map(trends, function (trend) {
                return trend.name.toLowerCase();
            });

            textTheme = randIndex(trendNames);

            while(!isAlpha(textTheme.substring(1, textTheme.length)) ) {
                textTheme = randIndex(trendNames);
            }
            console.log('Topic of convo: ' + textTheme);

            let myMessage = `Welcome! I'm an intelligent bot! Today, I am going to talk about ${textTheme}.`;
            bot.post('statuses/update', {
                status: myMessage
            }, function(err) {
                if(err) return handleError(err);
            });
            return textTheme;
        });
    }).then(() => {
        return textTheme;
    }).catch((err) => {
        handleError(err);
    });
};

let obtainTweetMessages = function(myTheme, callback) {
    let params = {
        q: myTheme,
        since: datestring(),
        lang: 'en',
        result_type: "mixed",
        count: 1000
    };

    return new Promise(function(resolve, reject) {
        bot.getAllTweets(params, function(err, reply) {
            if(err) return handleError(err);
            console.log("\nRetweet: retweeted response: " + reply.id);
        }).then(() => {
            return callback()
        })
    }).catch((err) => {
        handleError(err);
    })
};

twit.prototype.getAllTweets = function (params, callback) {
    return this.get('search/tweets', params, function (err, reply) {
        if(err) return callback(err);

        console.log('Length: ' + reply.statuses.length);
        return reply.statuses.forEach((tweet, index) => {
            return BlueBird.try(function() {
                return filterMessage(tweet.text);
            }).then((tweet) => {
                if(!myData.includes(tweet) && tweet.length >= 5) {
                    myData.push(tweet);
                    return tweet;
                }
            }).catch(err => {
                handleError(err);
            });
        });
    });
};

//remove @, links, RT, extra spaces
function filterMessage (myString) {
    let regexp = new RegExp('[#,@]([^\\s]*)','g');
    myString = myString.replace(new RegExp('#\\s([A-Za-z0-9_]+)', 'g'), '')
        .replace(/\r?\n|\r/g, ' ') // remove next line
        .replace(/RT/g, '') // remove RT
        .replace(regexp, '')
        .replace(/^\s+|\s+$/g, "") // hashtag, @
        .replace(/([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g, '') // emoji
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "") // link -- http
        .replace(/ +(?= )/g,'') // space
        .replace(/&amp;/g,'') // &amp;
        .replace(/&gt;/g,'') // &amp;
        .trim();
    myString = (myString[myString.length-1] === '.' ||
        myString[myString.length-1] === '?' ||
        myString[myString.length-1] === '!') ? myString : myString + '.';
    myString = (myString[myString.length-1] === ' ') ? myString : myString + ' ';
    return myString;
}

function handleError (err) {
    console.error("response status:", err.statusCode);
    console.error("response message:", err.message);
}

function isAlpha (ch){
    return typeof ch === "string" && (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z");
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

// main
botMessage();
function botMessage () {
    return new Promise(function(resolve) {
        setTimeout(() => resolve(1), 1000);
    }).then(() => {
        return findTrend();
    }).then((theme) => {
        return obtainTweetMessages(theme, function() {
            let tweet = '';
            myData.forEach((item) => {
                tweet += item;
            });

            // wiki search query
            let wikiOptions = {
                query: textTheme.replace(new RegExp('#([^\\s]*)','g'), ''),
                format: "html",
                summaryOnly: true,
                lang: "en"
            };

            Wiki.searchArticle(wikiOptions, function(err, htmlWikiText){
                if(err)
                    console.log('No data from Wikipedia.\n');

                let wikiText = (' ' + HtmlToText.fromString(htmlWikiText, {
                    wordwrap: 130
                }).replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").replace(/[\[\]']+/g,'').replace(/\n|\r/g, ""));

                console.log('Tweets Data: ' + tweet);
                console.log('Wiki Data: ' + wikiText);

                tweet += wikiText;

                // Markov Chain
                if(tweet.length === 0) {
                    console.log('No data.')
                } else {
                    let myGenerator = new MarkovChain(tweet);
                    setInterval(function() {
                        let myMessage = filterMessage(myGenerator.generate(2)) +
                            ` ${(textTheme[0] === '#') ? textTheme.replace(/\s+/g, '') : '#' + textTheme.replace(/\s+/g, '')}`;

                        GoogleTranslate(myMessage, {to: 'en'}).then(res => {
                            return res.text;
                        }).then((tweet) => {
                            bot.post('statuses/update', {
                                status: tweet
                            }, function(err, data, response) {
                                if(err) return handleError(err);
                            });
                        });
                    }, 36000);
                }
            });
        });
    }).catch((err) => {
        handleError(err);
    });
}