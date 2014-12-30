(function() {
    var push_to_DB = require('./pushToDB.js');
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

    obj.Library.push(objectify('cassert'));
    obj.Library.push(objectify('cctype'));
    obj.Library.push(objectify('cstring'));
    obj.Library.push(objectify('cmath'));
    obj.Library.push(objectify('cstdio'));

    obj.Class.push(objectify('vector'));
    obj.Class.push(objectify('set'));
    obj.Class.push(objectify('vector-bool'));

    obj.Function.push(objectify('strcat'));
    obj.Function.push(objectify('begin'));
    obj.Function.push(objectify('end'));
    obj.Function.push(objectify('resize'));
    obj.Function.push(objectify('push_back'));

    obj.Macro.push(objectify('FE_ENV'));

    obj.Type.push(objectify('size_t'));

    obj.Constant.push(objectify('INT_MAX'));

    obj.Enum.push(objectify('tst'));

    push_to_DB(obj, function() {
        console.log('success to push to DB');
    });
}).call(this);