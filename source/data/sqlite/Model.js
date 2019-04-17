var DataType = { BOOLEAN: 1, INTEGER: 2, TEXT: 3, BIGINT: 4, DOUBLE: 5, FLOAT: 6, BLOB: 7, TIMESTAMP: 8 };

var Model = (function() {
    return {
        User: {
            tablename:"user",
            columns: [
                {name: "name", datatype: DataType.TEXT},
                {name: "email", datatype: DataType.TEXT},
                {name: "sex", datatype: DataType.INTEGER},
                {name: "status", datatype: DataType.INTEGER}
            ]
        },
        Group: {
            tablename: "p_group",
            columns: [
                {name: "id", datatype: DataType.BIGINT},
                {name: "parent_id", datatype: DataType.BIGINT},
                {name: "name", datatype: DataType.TEXT},
                {name: "icon", datatype: DataType.TEXT},
                {name: "desc", datatype: DataType.TEXT},
                {name: "hidden", datatype: DataType.BOOLEAN},
                {name: "deleted", datatype: DataType.BIGINT}
            ]
        },
        Product: {
            tablename: "p_product",
            columns: [
                {name: "id", datatype: DataType.BIGINT},
                {name: "groupId", datatype: DataType.INTEGER},
                {name: "name", datatype: DataType.TEXT},
                {name: "imagePaths", datatype: DataType.TEXT},
                {name: "requiredAttr", datatype: DataType.TEXT},
                {name: "attributes", datatype: DataType.TEXT},
                {name: "desc", datatype: DataType.TEXT},
                {name: "hidden", datatype: DataType.BOOLEAN},
                {name: "deleted", datatype: DataType.BIGINT}
            ]
        },
        ProductDetail: {
            tablename: "p_product_detail",
            columns: [
                {name: "id", datatype: DataType.INTEGER},
                {name: "name", datatype: DataType.TEXT},
                {name: "productId", datatype: DataType.INTEGER},
                {name: "price", datatype: DataType.INTEGER},
                {name: "imagePaths", datatype: DataType.TEXT},
                {name: "requiredAttrs", datatype: DataType.TEXT},
                {name: "attributes", datatype: DataType.TEXT},
                {name: "desc", datatype: DataType.TEXT},
                {name: "hidden", datatype: DataType.BOOLEAN},
                {name: "deleted", datatype: DataType.BIGINT}
            ]
        },
        Discount: {
            tablename: "p_discount",
            columns: [
                {name: "id", datatype: DataType.TEXT},
                {name: "name", datatype: DataType.TEXT},
                {name: "type", datatype: DataType.TEXT},
                {name: "operator", datatype: DataType.TEXT},
                {name: "condition", datatype: DataType.TEXT},
                {name: "unit", datatype: DataType.TEXT},
                {name: "amount", datatype: DataType.TEXT},
                {name: "validFrom", datatype: DataType.TEXT},
                {name: "validTo", datatype: DataType.TEXT},
                {name: "status", datatype: DataType.TEXT}
            ]
        }
    };
})();
