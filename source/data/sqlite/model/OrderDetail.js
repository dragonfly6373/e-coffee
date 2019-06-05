var OrderDetail = {
    tablename: "p_order_detail",
    columns: [
        {name: "id", datatype: DataType.INTEGER},
        {name: "orderId", datatype: DataType.INTEGER},
        {name: "productId", datatype: DataType.INTEGER},
        {name: "desc", datatype: DataType.TEXT},
        {name: "hidden", datatype: DataType.BOOLEAN},
        {name: "deleted", datatype: DataType.BIGINT}
    ]
};
