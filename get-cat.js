var fs = require('fs')
var http = require('https')
var request = function(addr, callback) {
    http.get(addr, function(rsp) {
        var page = '';
        rsp.on('data', function(chunk) {
            page += chunk;
        }).on('end', function() {
            callback(page);
        });
    });
};

var addr = {
    host: 'en.wiktionary.org',
    path: '/w/api.php?' +
        'action=query' +
        '&list=categorymembers' +
        '&cmtitle=Category:German_compound_words' +
        '&format=json' +
        '&cmlimit=500'
};
var words = [];

var procCat = function(page) {
    var data = JSON.parse(page);
    words = words.concat(data.query.categorymembers);
    if (!data.batchcomplete && data.continue)
        request({
                host: addr.host,
                path: addr.path + '&cmcontinue=' + data.continue.cmcontinue
            },
            procCat
        );
    else
        fs.writeFile(
            __dirname + '\\German-compound-words.json',
            JSON.stringify(words, null, '  '),
            console.log.bind(console, 'export OK')
        );
    console.log('chunk processed');
};

request({ host: addr.host, path: addr.path + '&continue=' }, procCat);
