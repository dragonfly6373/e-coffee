var Category = {
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
};
