var fs = require('fs');
var http = require('http');

module.exports = function (body, callback_) {
    var classes = [], functions = [], macros = [], types = [], constants = [];
    var entry = {
        name: "",
        url: "",
    };

    //find classes
    var reStr = '<a\\s.*?href= \"([^\""]+)\"[^>]*><b>([^]*?)<\/b><\/a>[^]*?<span\\s.*?class=\"typ\"[^>]*>([^]*?)<\/span>';
    var tagRE = new RegExp(reStr, 'gm');
    var tagMatches = body.match(tagRE);
    if (tagMatches && tagMatches.length > 0) {
        for (var i = 0; i < tagMatches.length; i++) {
            var valRE = new RegExp(reStr, 'm');
            var valMatch = tagMatches[i].match(valRE);
            entry.url = valMatch[1];
            entry.name = valMatch[2];
            var type = valMatch[3];

            if (type.indexOf("class") >= 0) {
                classes.push(entry);
            } else if (type.indexOf("function") >= 0) {
                functions.push(entry);
            } else if (type.indexOf("macro") >= 0) {
                macros.push(entry);
            } else if (type.indexOf("type") >= 0) {
                types.push(entry);
            } else if (type.indexOf("constant") >= 0) {
                constants.push(entry);
            } else {
                console.log("Error: the type was unknown");
            }
        }
    }

    console.log(macros);
    callback_(classes, functions, macros, types, constants);
}