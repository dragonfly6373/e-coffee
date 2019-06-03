var DataAdapter = (function() {
    var DB_NAME;
    var __connection;
    function getConnection() {
        if (__connection != null) return __connection;
        console.log("try to connect db:", DB_NAME);
        __connection = new sqlite3.Database(DB_NAME);
        return __connection;
    }
    function convertDataByType(value, datatype) {
        switch(datatype) {
            case DataType.INT:
            case DataType.REAL:
            case DataType.NUMERIC:
                return value ? value : 0;
            case DataType.TEXT:
            case DataType.BLOB:
                return "'" + value + "'";
            default:
                return value ? value : 0;
        }
    }
    return {
        connect: function(path, callback) {
            DB_NAME = path;
            __connection = getConnection();
            return __connection;
        },
        create: function(clazz, callback) {
            console.log("Create:", clazz.tablename);
            var db = getConnection();
            var fields = clazz.columns.map(function(col) {
                return col.name + " " + convertDataByType(col.datatype) + "\n"
            }).join(",\n");
            var sql = String.format("CREATE TABLE {0} ({1})", clazz.tablename, fields);
            db.run(sql, function(error) {
                if (callback) callback(error);
            });
            db.close();
        },
        insert: function(clazz, data, callback) {
            console.log("Insert:", clazz.tablename, data);
            var db = getConnection();
            var values = clazz.columns.map(function(col) {
                return convertDataByType(data[col.name], col.datatype);
            }).join(",");
            db.run(String.format("INSERT INTO {0} ({1}) VALUES({2})", clazz.tablename, clazz.columns.map(function(col) { return col.name; }).join(","), values),
                [],
                function(output) {
                    if (callback) callback(output);
                    db.close();
                }
            );
            db.close();
        },
        insertMulti: function(clazz, list, callback) {
            console.log("Insert Multi:", clazz.tablename, data);
        },
        update: function(clazz, data, condition, callback) {
            console.log("Update:", clazz.tablename, data);
            var db = getConnection();
            // conn.run("UPDATE ...");
            db.close();
        },
        bashUpdate: function(clazz, values, condition, callback) {
            console.log("Update:", clazz.tablename, values, condition.build());
            var db = getConnection();
            // conn.run("UPDATE ...");
            db.close();
        },
        bashDelete: function(clazz, condition, callback) {
            console.log("Delete:", clazz.tablename, condition.build());
            var db = getConnection();
            // conn.run("DELETE ...");
            db.close();
        },
        getAll: function(clazz, condition, callback) {
            console.log("Get all:", clazz.tablename, (condition ? " with condition " + condition.build() : ""));
            var db = getConnection();
            var sql = String.format("SELECT {0} FROM {1} WHERE {2}",
                        "rowid oid, " + clazz.columns.map(function(col) { return col.name; }).join(),
                        clazz.tablename,
                        condition ? condition.build() : "1 = 1");
            console.log("### SQL:", sql);
            db.all(sql, [], function(err, result) {
                console.log("### getAll:", err, result);
                if (!err) callback(result);
                db.close();
            });
        },
        getById: function(clazz, id, callback) {
            console.log("Get by Id:", clazz.tablename, id);
            var conn = getConnection();
            conn.get("SELECT * FROM $tablename WHERE id = $id", {$tablename: clazz.tablename, $id: id}, callback);
        },
        query: function(sql, callback) {
            console.log("Query by condition: ", clazz.tablename, condition);
            var conn = getConnection();
            conn.all("SELECT * FROM $tablename WHERE ")
        }
    }
})();
