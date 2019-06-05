var ProductDetail = {
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
};
