var fs = require('fs')
var http = require('https')
var request = require('request')
var querystring = require('querystring')

var addr = {
    host: 'en.wikipedia.org',
    path: '/w/api.php?' +
        'action=query' +
        '&prop=revisions' +
        '&rvprop=content' +
        '&format=json'
};
var ignoreRE = /compound|[\n{}.]/ig;
var catName = '===Etymology===';
var isPart = function(ch) { return ch.indexOf('=') === -1 && ch.length > 0; };

var dict = [];
var errLog = [];
var queue = [];
var counter = 0;
var chunkSize = 50;
var exportName = '\\composers-raw.json';
var importName = '\\title-list.json';

var chunkController = function() {
    var chunkIds = queue.splice(0, chunkSize);
    if (chunkIds.length === 0) {
        console.log('queue empty');
        return;
    };
    request(
        {host: addr.host, path: addr.path + '&pageids=' + chunkIds.join('|')},
        procWordChunk
    );
    setTimeout(chunkController, 100);
};
var exportController = function() {
    if (counter > 0) {
        console.log(counter + ' to go')
        return;
    }
    fs.writeFile(
        __dirname + logName,
        JSON.stringify(errLog, null, '  '),
        console.log.bind(console, 'log export OK')
    );
    fs.writeFile(
        __dirname + exportName,
        JSON.stringify(dict, null, '  '),
        console.log.bind(console, 'export OK')
    );
};

var procWordChunk = function(page) {
    var data = JSON.parse(page);
    if (!data.query || !data.query.pages) {
        counter -= chunkSize;
        errLog.push({ id: null, err: page });
    } else {
        data = data.query.pages;
        Object.keys(data).forEach(function(id) {
            counter--;
            pushWord(data[id]);
        });
    }
    exportController();
};
var pushWord = function(data) {
    var etymo = data.revisions[0]['*'];
    if (etymo.indexOf(catName) === -1) {
        errLog.push({id: data.pageid, err: 'cat'});
        return;
    }
    dict.push({
        word: data.title,
        parts: etymo.replace(ignoreRE, '').split('|').filter(isPart)
    });
};

fs.readFile(__dirname + importName, 'utf8', function(err, data) {
    queue = JSON.parse(data).map(function(el) { return el.pageid; });
    counter = queue.length;
    chunkController();
});
