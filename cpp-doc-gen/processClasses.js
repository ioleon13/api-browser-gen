var fs = require('fs');
var request = require('request');
var process_entries = require('./processEntries.js');
var process_function_like = require('./processFunctionlike.js');

var HOST_URL = 'http://www.cplusplus.com';

var options = {
    method: 'GET',
    url: HOST_URL + '/reference/',
    encoding: 'utf8'
};

module.exports = function (libname, classes, callback_) {
    var html_data;
    var final_data;
    var file_name;
    var functions = [], macros = [], types = [], constants = [],
    objects = [], enums = [], namespaces = [], unknowns = [];

    if (classes.length === 0) {
        callback_(functions, macros, types, constants, objects, enums, namespaces, unknowns);
        return;
    }

    var classCount = 0;
    parseClass(classes[0]);
    function parseClass(class_) {
        options.url = HOST_URL + class_.url;
        console.log('parsing the class page: ' + options.url);

        request(options, function (error, response, body) {
            if (error) {
                callback_(functions, macros, types, constants, objects, enums, namespaces, unknowns);
                return console.error('Failed to request the page: ' + options.url + ', error: ' + error);
            }

            if (!error && response.statusCode === 200) {
                //get the file name
                var split_file = class_.url.split('/');
                for (var i = 1; i < split_file.length - 1; i++) {
                    file_name += split_file[i];
                    if (i !== split_file.length-2) {
                        file_name += '-';
                    }
                };
                //file_name = libname + '-' +split_file[split_file.length-2];
                console.log("save class file: " + file_name + ".html...");

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
                        process_entries(file_name, html_data, function(classes_, functions_, macros_, types_, constants_, objects_, enums_, namespaces_, unknowns_) {
                            html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1.html"><b>');
                            html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1-$2.html"><b>');
                            html_data = html_data.replace(/<a href= \"\/reference\/([^\/]+)\/([^\/]+)\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1-$2-$3.html"><b>');
                            html_data = html_data.replace(/<a href=\"\/([^\/]+)\"[^>]*>([^]*?)<\/a>/g, '<a href="$1.html">$2</a>');
                            html_data = html_data.replace(/<a href=\"&lt;([^]*?)&gt;\.html\">([^]*?)<\/a>/g, '<a href="$1.html">$2</a>');
                            final_data = "<!-- single file version -->\n<!DOCTYPE html>\n<html>\n<head>\n  <link href=\"css/main.css\" rel=\"stylesheet\" type=\"text/css\">\n  <meta charset=\"utf-8\" />\n</head>\n<body>" + html_data + "\n</body>\n</html>\n";
                            fs.writeFileSync("CPP-docset/Contents/Resources/Documents/" + file_name + ".html", final_data, 'utf-8');

                            Array.prototype.push.apply(functions, functions_);
                            Array.prototype.push.apply(macros, macros_);
                            Array.prototype.push.apply(types, types_);
                            Array.prototype.push.apply(constants, constants_);
                            Array.prototype.push.apply(enums, enums_);
                            Array.prototype.push.apply(objects, objects_);
                            Array.prototype.push.apply(namespaces, namespaces_);
                            Array.prototype.push.apply(unknowns, unknowns_);

                            //process function like page, just save html files
                            process_function_like(file_name, functions, function(error) {
                                process_function_like(file_name, macros, function(error) {
                                    process_function_like(file_name, types, function(error) {
                                        process_function_like(file_name, constants, function(error) {
                                            process_function_like(file_name, enums, function(error) {
                                                process_function_like(file_name, unknowns, function(error) {
                                                    console.log('Complete to process function like pages for ' + file_name);
                                                })
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                }

                classCount++;
                if (classCount === classes.length) {
                    callback_(functions, macros, types, constants, objects, enums, namespaces, unknowns);
                    return;
                }
                parseClass(classes[classCount]);
            }
        });
    };
}