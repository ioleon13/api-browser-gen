(function() {
    var http = require('http');
    var request = require('request');
    var Sequelize = require("sequelize");
    var fs = require('fs');
    var url = require('url');
    var process_entries = require('./processEntries.js');
    var process_classes = require('./processClasses.js');
    var process_function_like = require('./processFunctionlike.js');

    var pages = [];
    var options = {
        method: 'GET',
        hostname: 'www.cplusplus.com',
        port: 80,
        path: '/reference/',
    };

    //make dirs
    var prev = "";
    var SOURCE_DIR='CPP-docset/Contents/Resources/Documents/css';
    for (i$ = 0, len$ = (ref$ = SOURCE_DIR.split("/")).length; i$ < len$; ++i$) {
        dir = ref$[i$];
        if (!fs.existsSync(prev + dir)) {
            fs.mkdirSync(prev + dir);
        } 
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

    //There are six types objects in cpp
    var obj = {
        Library: [],
        Class: [],
        Function: [],
        Macro: [],
        Type: [],
        Constant: [],
        Object: [],
        Enum: [],
        Namespace: []
    };

    //make a object for sqlite3
    //SQLite database was:
    //CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT);
    objectify = function(_name){
        return {
            name: _name,
            path: _name + ".html"
        };
    };

    var html_data;
    var final_data;
    var file_name;

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
                    var reStr = '<a\\s.*?href=\"([^\""]+)\"[^>]*><span>&lt;([^]*?)&gt;';
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
                                obj.Library.push(objectify(valMatch[2]));
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
                    //get the filename
                    var split_file = page.split('/');
                    file_name = split_file[split_file.length-2];
                    console.log("save " + file_name + ".html...");

                    //get html data and save to html files
                    var reStr = '<div\\s.*?class=\"C_supportbottom\"[^>]*><\/div><\/div>([^]*?)<div\\s.*?id=\"I_nav\"[^>]*>';
                    var tagRE = new RegExp(reStr, 'gm');
                    var tagMatches = body.match(tagRE);
                    if (tagMatches && tagMatches.length > 0) {
                        for (var i = 0; i < tagMatches.length; i++) {
                            var valRE = new RegExp(reStr, 'm');
                            var valMatch = tagMatches[i].match(valRE);
                            html_data = valMatch[1];

                            //process entries
                            process_entries(html_data, function(classes, functions, macros, types, constants, objects, enums, namespaces) {
                                html_data = html_data.replace(/<a href= \".*?\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1.html"><b>');
                                final_data = "<!-- single file version -->\n<!DOCTYPE html>\n<html>\n<head>\n  <link href=\"css/main.css\" rel=\"stylesheet\" type=\"text/css\">\n  <meta charset=\"utf-8\" />\n</head>\n<body>" + html_data + "\n</body>\n</html>\n";
                                fs.writeFileSync("CPP-docset/Contents/Resources/Documents/" + file_name + ".html", final_data, 'utf-8');

                                classes.forEach(function (doc_class) {
                                    obj.Class.push(objectify(doc_class.name));
                                });

                                functions.forEach(function (doc_function) {
                                    obj.Function.push(objectify(doc_function.name));
                                });

                                macros.forEach(function (doc_macro) {
                                    obj.Macro.push(objectify(doc_macro.name));
                                });

                                types.forEach(function (doc_type) {
                                    obj.Type.push(objectify(doc_type.name));
                                });

                                constants.forEach(function (doc_constant) {
                                    obj.Constant.push(objectify(doc_constant.name));
                                });

                                objects.forEach(function (doc_object) {
                                    obj.Object.push(objectify(doc_object.name));
                                });

                                enums.forEach(function (doc_enum) {
                                    obj.Enum.push(objectify(doc_enum.name));
                                });

                                namespaces.forEach(function (doc_namespace) {
                                    obj.Namespace.push(objectify(doc_namespace.name));
                                });

                                process_classes(classes, function() {
                                    process_function_like(functions, function(error) {
                                        process_function_like(macros, function(error) {
                                            process_function_like(types, function(error) {
                                                process_function_like(constants, function(error) {
                                                    process_function_like(enums, function(error) {
                                                        process_function_like(objects, function(error) {
                                                            process_function_like(namespaces, function(error) {
                                                                console.log("Complete to process entries for: " + file_name);
                                                            })
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    }

                    //console.log(obj.Function);
                    //return;
                    pageCount++;
                    if (pageCount === pages.length) {
                        console.log(obj.Function);
                        return;
                    }
                    parsePage(pages[pageCount]);
                }
            });

            res.on('error', function(e) {
                console.log(e.message);
            });
        });
    };
}).call(this);