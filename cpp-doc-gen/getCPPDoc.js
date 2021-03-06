(function() {
    var request = require('request');
    var fs = require('fs');
    var url = require('url');
    var process_entries = require('./processEntries.js');
    var process_classes = require('./processClasses.js');
    var process_function_like = require('./processFunctionlike.js');
    var push_to_DB = require('./pushToDB.js');

    var HOST_URL = 'http://www.cplusplus.com';

    var pages = [];
    var options = {
        method: 'GET',
        url: HOST_URL + '/reference/',
        encoding: 'utf8'
    };

    //make dirs
    var prev = "";
    var DOC_DIR = 'CPP-docset/Contents/Resources/Documents/';
    var SOURCE_DIR = DOC_DIR + 'css';
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
    objectify = function(_name, _filename){
        return {
            name: _name,
            path: _filename + ".html"
        };
    };

    var html_data;
    var final_data;
    var file_name;

    // start parse page
    var pageCount = 0;
    parsePage("");
    function parsePage(page) {
        if (page !== "") {
            options.url = HOST_URL + page;
        }
        console.log('parsing the page: ' + options.url);

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error was occurred, push to db...');
                push_to_DB(obj, function() {
                    console.log('success to push to DB');
                });
                
                return console.error('Failed to request the page: ' + options.url + ', error: ' + error);
            }

            if (!error && response.statusCode === 200) {
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
                                obj.Library.push(objectify(valMatch[2], valMatch[2]));
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
                            process_entries(file_name, html_data, function(classes, functions, macros, types, constants, objects, enums, namespaces, unknowns) {
                                html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1.html"><b>');
                                html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1-$2.html"><b>');
                                html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/([^\/]+)\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1-$2-$3.html"><b>');
                                html_data = html_data.replace(/<a href=\"\/([^\/]+)\"[^>]*>([^]*?)<\/a>/g, '<a href="$1.html">$2</a>');
                                html_data = html_data.replace(/<a href=\"&lt;([^]*?)&gt;\.html\">([^]*?)<\/a>/g, '<a href="$1.html">$2</a>');
                                final_data = "<!-- single file version -->\n<!DOCTYPE html>\n<html>\n<head>\n  <link href=\"css/main.css\" rel=\"stylesheet\" type=\"text/css\">\n  <meta charset=\"utf-8\" />\n</head>\n<body>" + html_data + "\n</body>\n</html>\n";
                                fs.writeFileSync(DOC_DIR + file_name + ".html", final_data, 'utf-8');

                                classes.forEach(function (doc_class) {
                                    obj.Class.push(objectify(doc_class.name, doc_class.filename));
                                });

                                functions.forEach(function (doc_function) {
                                    obj.Function.push(objectify(doc_function.name, doc_function.filename));
                                });

                                macros.forEach(function (doc_macro) {
                                    obj.Macro.push(objectify(doc_macro.name, doc_macro.filename));
                                });

                                types.forEach(function (doc_type) {
                                    obj.Type.push(objectify(doc_type.name, doc_type.filename));
                                });

                                constants.forEach(function (doc_constant) {
                                    obj.Constant.push(objectify(doc_constant.name, doc_constant.filename));
                                });

                                objects.forEach(function (doc_object) {
                                    obj.Object.push(objectify(doc_object.name, doc_object.filename));
                                });

                                enums.forEach(function (doc_enum) {
                                    obj.Enum.push(objectify(doc_enum.name, doc_enum.filename));
                                });

                                namespaces.forEach(function (doc_namespace) {
                                    obj.Namespace.push(objectify(doc_namespace.name, doc_namespace.filename));
                                });

                                process_classes(file_name, classes, function(functions_, macros_, types_, constants_, objects_, enums_, namespaces_, unknowns_) {
                                    functions_.forEach(function (doc_function) {
                                        obj.Function.push(objectify(doc_function.name, doc_function.filename));
                                    });

                                    macros_.forEach(function (doc_macro) {
                                        obj.Macro.push(objectify(doc_macro.name, doc_macro.filename));
                                    });

                                    types_.forEach(function (doc_type) {
                                        obj.Type.push(objectify(doc_type.name, doc_type.filename));
                                    });

                                    constants_.forEach(function (doc_constant) {
                                        obj.Constant.push(objectify(doc_constant.name, doc_constant.filename));
                                    });

                                    objects_.forEach(function (doc_object) {
                                        obj.Object.push(objectify(doc_object.name, doc_object.filename));
                                    });

                                    enums_.forEach(function (doc_enum) {
                                        obj.Enum.push(objectify(doc_enum.name, doc_enum.filename));
                                    });

                                    namespaces_.forEach(function (doc_namespace) {
                                        obj.Namespace.push(objectify(doc_namespace.name, doc_namespace.filename));
                                    });

                                    process_function_like(file_name, functions, function(error) {
                                        process_function_like(file_name, macros, function(error) {
                                            process_function_like(file_name, types, function(error) {
                                                process_function_like(file_name, constants, function(error) {
                                                    process_function_like(file_name, enums, function(error) {
                                                        process_function_like(file_name, objects, function(error) {
                                                            process_function_like(file_name, namespaces, function(error) {
                                                                process_function_like(file_name, unknowns, function(error) {
                                                                    console.log("Complete to process entries for: " + file_name);
                                                                });
                                                            });
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
                        //console.log(obj.Function);
                        console.log('Parse completed! push to db...');
                        push_to_DB(obj, function() {
                            console.log('success to push to DB');
                        });
                        return;
                    }
                    parsePage(pages[pageCount]);
                }
            };
        });
    };
}).call(this);