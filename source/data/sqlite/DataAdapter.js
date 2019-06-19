var DataType = { BOOLEAN: 1, INTEGER: 2, TEXT: 3, BIGINT: 4, DOUBLE: 5, FLOAT: 6, BLOB: 7, TIMESTAMP: 8, DATE: 9 };
var DataAdapter = (function() {
    var DB_NAME;
    var __connection;
    function getConnection() {
        console.log("try to connect db:", DB_NAME, __connection);
        if (!__connection || !__connection.open)
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
    function toSqliteType(dataType) {
        switch(dataType) {
            case DataType.BOOLEAN:
            case DataType.INTEGER:
                return "INTEGER";
            case DataType.DOUBLE:
            case DataType.FLOAT:
            case DataType.DATE:
            case DataType.TIMESTAMP:
                return "REAL";
            case DataType.TEXT:
                return "TEXT";
            case DataType.BLOB:
                return "BLOB";
            default:
                return "TEXT";
        }
    }
    return {
        connect: function(path, callback) {
            DB_NAME = path;
            __connection = getConnection();
            return this;
        },
        create: function(clazz, callback) {
            console.log("Create:", clazz.tablename);
            var db = getConnection();
            var fields = clazz.columns.map(function(col) {
                return col.name + " " + toSqliteType(col.datatype)
            }).join(",\n");
            var sql = String.format("CREATE TABLE {0} ({1});", clazz.tablename, fields);
            console.log("Execute Query:", sql);
            db.run(sql, function(error) {
                if (callback) callback(error);
                db.close();
            });
        },
        insert: function(clazz, data, callback) {
            console.log("Insert:", clazz.tablename, data);
            var db = getConnection();
            var values = clazz.columns.map(function(col) {
                return convertDataByType(data[col.name], col.datatype);
            }).join(",");
            var sql = String.format("INSERT INTO {0} ({1}) VALUES({2})", clazz.tablename, clazz.columns.map(function(col) { return col.name; }).join(","), values);
            console.log("Execute Query:", sql);
            db.run(sql, [],
                function(error) {
                    if (callback) callback(error);
                    db.close();
                }
            );
        },
        insertMulti: function(clazz, list, callback) {
            console.log("Insert Multi:", clazz.tablename, data);
        },
        update: function(clazz, data, condition, callback) {
            console.log("Update:", clazz.tablename, data);
            var db = getConnection();
            var values = clazz.columns.map(function(col) {
                return col + " = " + convertDataByType(data[col.name], col.datatype);
            }).join(",");
            var sql = String.format("UPDATE {0} SET {1} WHERE {2}", clazz.tablename, values, condition.build());
            console.log("Execute Query:", sql);
            db.run(sql, [], function(output) {
                    if (callback) callback(output);
                    db.close();
                }
            );
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
            conn.get("SELECT * FROM $tablename WHERE id = $id", {$tablename: clazz.tablename, $id: id}, function(data) {
                if (callback) callback(data);
            });
        },
        query: function(sql, callback) {
            console.log("Query by condition: ", clazz.tablename, condition);
            var conn = getConnection();
            conn.all("SELECT * FROM $tablename WHERE ")
        }
    }
})();
