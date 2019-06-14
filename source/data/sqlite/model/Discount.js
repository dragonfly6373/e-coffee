var Discount = {
    tablename: "p_discount",
    columns: [
        {name: "id", datatype: DataType.INTEGER},
        {name: "name", datatype: DataType.TEXT},
        {name: "type", datatype: DataType.INTEGER},
        {name: "operator", datatype: DataType.TEXT},
        {name: "condition", datatype: DataType.TEXT},
        {name: "unit", datatype: DataType.TEXT},
        {name: "amount", datatype: DataType.INTERGER},
        {name: "validFrom", datatype: DataType.DATE},
        {name: "validTo", datatype: DataType.DATE},
        {name: "status", datatype: DataType.INTEGER}
    ]
};
