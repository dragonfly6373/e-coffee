const DataType = { BOOLEAN: 1, INTEGER: 2, TEXT: 3, BIGINT: 4, DOUBLE: 5, FLOAT: 6, BLOB: 7, TIMESTAMP: 8, DATE: 9 };
const COLUMN_ID = "rowid";

var DataAdapter = (function() {
    var DB_NAME;
    var __connection;
    function getConnection() {
        console.log("try to connect db:", DB_NAME, __connection);
        if (!__connection || !__connection.open)
            __connection = new sqlite3.Database(DB_NAME);
        return __connection;
    }
    function onClose(err) {
        if (err) console.error(err.message);
        // else console.log("[SQLITE] database is closed");
    }
    function convertDataByType(value, datatype) {
        switch(datatype) {
            case DataType.BOOLEAN:
            case DataType.INTEGER:
            case DataType.BIGINT:
            case DataType.DOUBLE:
            case DataType.FLOAT:
            case DataType.TIMESTAMP:
            case DataType.DATE:
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
    function getColumns(model) {
        return model.columns.filter(function(col) {
            return col != "id";
        });
    }
    return {
        connect: function(path, callback) {
            DB_NAME = path;
            __connection = getConnection();
            return this;
        },
        create: function(clazz, callback) {
            console.log("Create:", clazz.tablename);
            var columns = getColumns(clazz);
            var fields = columns.map(function(col) {
                return col.name + " " + toSqliteType(col.datatype);
            }).join(",\n");
            var sql = String.format("CREATE TABLE {0} ({1});", clazz.tablename, fields);
            console.log("Execute Query:", sql);
            var conn = getConnection();
            try {
                conn.run(sql, function(error) {
                    if (callback) {
                        if (error) callback({error: error});
                        else callback(true);
                    }
                });
            } finally {
                conn.close(onClose);
            }
        },
        insert: function(clazz, data, callback) {
            console.log("Insert:", clazz.tablename, data);
            var conn = getConnection();
            var columns = getColumns(clazz);
            var values = columns.map(function(col) {
                return convertDataByType(data[col.name], col.datatype);
            }).join(",");
            var sql = String.format("INSERT INTO {0} ({1}) VALUES({2})", clazz.tablename, columns.map(function(col) { return col.name; }).join(","), values);
            console.log("Execute Query:", sql);
            try {
                conn.run(sql, [], function(error) {
                        if (callback) {
                            if (error) callback({error: error});
                            else callback(this.lastID);
                        }
                    }
                );
            } finally {
                conn.close(onClose);
            }
        },
        insertMulti: function(clazz, datalist, callback) {
            console.log("Insert Multi:", clazz.tablename, datalist);
            // TODO: under-construction
        },
        bashUpdate: function(clazz, values, condition, callback) {
            console.log("Update:", clazz.tablename, values, condition.build());
            var mapStr = Object.keys(values).map(function(col) {
                return (col != "id" ? col : "rowid") + " = " + convertDataByType(values[col], clazz.columns[col].datatype);
            }).join(",");
            var sql = String.format("UPDATE {0} SET {1} WHERE {2}", clazz.tablename, mapStr, condition.build());
            console.log("Execute Query:", sql);
            var conn = getConnection();
            try {
                conn.run(sql, [], function(error) {
                    if (callback) {
                        if (error) callback({error: error});
                        else callback(this.changes);
                    }
                });
            } finally {
                conn.close(onClose);
            }
        },
        bashDelete: function(clazz, condition, callback) {
            console.log("Delete:", clazz.tablename, condition.build());
            var sql = String.format("DELETE FROM {0} WHERE {1}", clazz.tablename, condition.build());
            console.log("Execute Query:", sql);
            var conn = getConnection();
            try {
                conn.run(sql, [], function(error) {
                    if (callback) {
                        if (error) callback({error: error});
                        else callback(this.changes);
                    }
                });
            } finally {
                conn.close(onClose);
            }
        },
        getAll: function(clazz, condition, callback) {
            console.log("Get all:", clazz.tablename, (condition ? " with condition " + condition.build() : ""));
            var columns = getColumns(clazz);
            var sql = String.format("SELECT {0} FROM {1} WHERE {2}",
                        "rowid id, " + columns.map(function(col) { return col.name; }).join(", "),
                        clazz.tablename,
                        condition ? condition.build() : "1 = 1");
            console.log("### SQL:", sql);
            var conn = getConnection();
            try {
                conn.all(sql, [], function(error, result) {
                    console.log("### getAll:", error, result);
                    if (callback) {
                        if (error) callback({error: error});
                        else callback(result);
                    }
                });
            } finally {
                conn.close(onClose);
            }
        },
        getById: function(clazz, id, callback) {
            console.log("Get by Id:", clazz.tablename, id);
            var columns = getColumns(clazz);
            var conn = getConnection();
            try {
                conn.get("SELECT $0 FROM $1 WHERE rowid = $2",
                    {
                        0: "rowid id" + columns.map(function(col) { return col.name; }).join(", "),
                        1: clazz.tablename,
                        2: id
                    },
                    function(data) {
                        if (callback) {
                            if (eror) callback({error: error});
                            else callback(data);
                        }
                    });
            } finally {
                conn.close(onClose);
            }
        },
        query: function(sql, callback) {
            console.log("sql:", sql);
            var conn = getConnection();
            try {
                conn.all(sql, [], function(error, data) {
                    if (callback) {
                        if (error) callback({error: error});
                        else callback(data);
                    }
                });
            } finally {
                conn.close(onClose);
            }
        }
    }
})();
