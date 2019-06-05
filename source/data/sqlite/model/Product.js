var Product = {
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
};
