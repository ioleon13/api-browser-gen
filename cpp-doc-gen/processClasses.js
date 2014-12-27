var fs = require('fs');
var http = require('http');
var process_entries = require('./processEntries.js');
var process_function_like = require('./processFunctionlike.js');

var options = {
    method: 'GET',
    hostname: 'www.cplusplus.com',
    port: 80,
    path: '/reference/',
};

module.exports = function (classes, callback_) {
    var html_data;
    var final_data;
    var file_name;
    var classReq, body;

    if (classes.length === 0) {
        callback_();
        return;
    }

    var classCount = 0;
    parseClass(classes[0]);
    function parseClass(class_) {
        options.path = class_.url;
        console.log('parsing the page: ' + options.hostname + options.path);

        classReq = http.get(options, function(res) {
            body = '';
            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                //get the filename
                var split_file = class_.url.split('/');
                file_name = split_file[split_file.length-2];
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
                        process_entries(html_data, function(classes, functions, macros, types, constants, objects, enums, namespaces) {
                            html_data = html_data.replace(/<a href= \".*?\/([^\/]+)\/\"[^>]*><b>/g, '<a href= "$1.html"><b>');
                            final_data = "<!-- single file version -->\n<!DOCTYPE html>\n<html>\n<head>\n  <link href=\"css/main.css\" rel=\"stylesheet\" type=\"text/css\">\n  <meta charset=\"utf-8\" />\n</head>\n<body>" + html_data + "\n</body>\n</html>\n";
                            fs.writeFileSync("CPP-docset/Contents/Resources/Documents/" + file_name + ".html", final_data, 'utf-8');

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

                            enums.forEach(function (doc_enum) {
                                obj.Enum.push(objectify(doc_enum.name));
                            });

                            //process function like page, just save html files
                            process_function_like(functions, function(error) {
                                process_function_like(macros, function(error) {
                                    process_function_like(types, function(error) {
                                        process_function_like(constants, function(error) {
                                            process_function_like(enums, function(error) {
                                                console.log('Complete to process function like pages for ' + file_name);
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
                    callback_();
                    return;
                }
                parseClass(classes[classCount]);
            });
        });
    };
}