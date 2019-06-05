var Order = {
    tablename: "p_order",
    columns: [
        {name: "id", datatype: DataType.BIGINT},
        {name: "desc", datatype: DataType.TEXT},
        {name: "status", datatype: DataType.BIGINT},
        {name: "hidden", datatype: DataType.BOOLEAN},
        {name: "deleted", datatype: DataType.BIGINT}
    ],
    Status: {
        SUCCESS: 1,
        PENDING: 2,
        CANCEL: 0
    }
};
