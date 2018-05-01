const Markov = require('libmarkov');
var htmlToText = require('html-to-text');

var wikipedia = require("wikipedia-js");
var query = "Kevin Love";

var options = {query: query, format: "html", summaryOnly: true, lang: "en"};
wikipedia.searchArticle(options, function(err, htmlWikiText){
    if(err){
        console.log("An error occurred[query=%s, error=%s]", query, err);
        return;
    }

    var text = htmlToText.fromString(htmlWikiText, {
        wordwrap: 130
    }).replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").replace(/[\[\]']+/g,'').replace(/\n|\r/g, "");

    let myGenerator = new Markov(text);
    console.log (myGenerator.generate(2));
});