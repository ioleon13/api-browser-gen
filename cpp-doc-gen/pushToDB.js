var Sequelize = require("sequelize");
var seq = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: 'CPP-docset/Contents/Resources/docSet.dsidx'
});

var SearchIndex = seq.define('searchIndex', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.STRING
        },
        path: {
            type: Sequelize.STRING
        }
    }, {
        freezeTableName: true,
        timestamps: false
    }
);

module.exports = function (obj, callback_) {
    SearchIndex.sync().success(function(){
        var key, ref$, items, lresult$, i$, len$, item, si, results$ = [];
        for (key in ref$ = obj) {
            items = ref$[key];
            lresult$ = [];
            for (i$ = 0, len$ = items.length; i$ < len$; ++i$) {
                item = items[i$];
                si = SearchIndex.build({
                    name: item.name,
                    type: key,
                    path: item.path
                });
                lresult$.push(si.save());
            }
            results$.push(lresult$);
        }
        callback_();
        return results$;
    });
}