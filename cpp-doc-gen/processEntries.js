var fs = require('fs');
var http = require('http');

module.exports = function (body, callback_) {
    var classes = [], functions = [], macros = [], types = [],
    constants = [], objects = [], enums = [], namespaces = [];
    /*var entry = {
        name: "",
        url: "",
    };*/

    //find classes
    var reStr = '<a\\s.*?href= \"([^\""]+)\"[^>]*><b>[^]*?<span\\s.*?class=\"typ\"[^>]*>([^]*?)<\/span>';
    var tagRE = new RegExp(reStr, 'gm');
    var tagMatches = body.match(tagRE);
    if (tagMatches && tagMatches.length > 0) {
        for (var i = 0; i < tagMatches.length; i++) {
            var valRE = new RegExp(reStr, 'm');
            var valMatch = tagMatches[i].match(valRE);
            var _url = valMatch[1];
            var split_url = _url.split('/');
            var _name = split_url[split_url.length-2];

            var entry = {
                name: _name,
                url: _url,
            };

            var type = valMatch[2];

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
            } else if (type.indexOf("object") >= 0) {
                objects.push(entry);
            } else if (type.indexOf("enum") >= 0) {
                enums.push(entry);
            } else if (type.indexOf("namespace") >= 0) {
                namespaces.push(entry);
            } else {
                console.log("Error: the type was unknown: " + type);
            }
        }
    }
    callback_(classes, functions, macros, types, constants, objects, enums, namespaces);
}