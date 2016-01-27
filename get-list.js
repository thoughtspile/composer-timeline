var fs = require('fs')
var request = require('request')

var addr = {
    host: 'https://en.wikipedia.org',
    path: '/w/api.php' +
        '?action=query'+
        '&prop=revisions'+
        '&rvprop=content'+
        '&format=json'+
        '&pageids=6921880'
};
var exportName = __dirname + '\\title-list.json';

var handlePage = function(rerr, rsp, page) {
    var data = JSON.parse(page);
    var names = data.query.pages['6921880'].revisions[0]['*']
        .match(/==A==([\s\S]*?)==See also==/)[1]
        .match(/\[\[.*/g)
        .map(s => {
            console.log(s)
            var raw = s.match(/\[\[(.*?)[|\]].*?(\((.*?)\))?/);
            return raw[1];
            res = {
                title: raw[1],
                minidesc: raw[3]
            }
        });
    fs.writeFileSync(exportName, JSON.stringify(names, null, '\t'));
};

request(addr.host + addr.path, handlePage);
