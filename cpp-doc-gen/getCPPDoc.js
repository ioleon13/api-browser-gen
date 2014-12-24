(function() {
    var http = require('http');
    var request = require('request');
    var Sequelize = require("sequelize");
    var fs = require('fs');
    var url = require('url');

    var pages = [];
    var options = {
        method: 'GET',
        hostname: 'www.cplusplus.com',
        port: 80,
        path: '/reference/',
    };

    //make dirs
    var prev = "";
    var SOURCE_DIR='CPP.docset/Contents/Resources/Documents/css';
    for (i$ = 0, len$ = (ref$ = SOURCE_DIR.split("/")).length; i$ < len$; ++i$) {
        dir = ref$[i$];
        fs.exists(prev + dir, function(exists) {
            if (!exists) {
                fs.mkdirSync(prev + dir);
            }
        });
        
        prev = prev + dir + "/";
    }

    //download css and png
    var fileUrls = [];
    var css_url = 'http://www.cplusplus.com/v321/main.css';
    var png_url = 'http://www.cplusplus.com/v321/bg.png';
    fileUrls.push(css_url);
    fileUrls.push(png_url);
    var css_dir = SOURCE_DIR + '/main.css';
    var png_dir = SOURCE_DIR + '/bg.png'

    fileUrls.forEach(function(fileurl) {
        var filepath = '';
        if (fileurl === css_url) {
            filepath = css_dir;
        } else{
            filepath = png_dir;
        }
        request(fileurl).pipe(fs.createWriteStream(filepath));
    });

    // start parse page
    var pageReq, body;
    var pageCount = 0;
    parsePage("");
    function parsePage(page) {
        if (page !== "") {
            options.path = page;
        }
        console.log('parsing the page: ' + options.hostname + options.path);

        pageReq = http.get(options, function(res) {
            body = '';
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                if (page === "") {
                    var reStr = '<a\\s.*?href=\"([^\""]+)\"[^>]*><span>([^]*?)<\/span>';
                    var tagRE = new RegExp(reStr, 'gm');
                    var tagMatches = body.match(tagRE);
                    if (tagMatches && tagMatches.length > 0) {
                        for (var i = 0; i < tagMatches.length; i++) {
                            var valRE = new RegExp(reStr, 'm');
                            var valMatch = tagMatches[i].match(valRE);
                            //console.log(valMatch);
                            if (valMatch && valMatch.length > 0) {
                                var value = valMatch[1];
                                pages.push(value);
                            } else {
                                pages.push(null);
                            }
                        }
                    }

                    if (pages.length === 0) {
                        return;
                    }
                    parsePage(pages[0]);
                } else{
                    console.log(body);
                    return;
                    pageCount++;
                    if (pageCount === pages.length) {
                        return;
                    }
                    //parsePage(pages[pageCount]);
                }
            });

            res.on('error', function(e) {
                console.log(e.message);
            });
        });
    };
}).call(this);