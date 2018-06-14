var BaseModel = {
    host: "localhost",
    user: "root",
    pass: "",
    database: "data.sql"
};
var productDetail = {
    tableName: "p_product_detail",
    columns: {
        id: "id",
        name: "name",
        productId: "product_id",
        price: "price",
        imagePaths: "image_paths",
        requiredAttrs: "required_attrs",
        attributes: "attributes",
        desc: "desc",
        hidden: "hidden",
        deleted: "deleted"
    }
};
BaseModel.productDetail = productDetail;
var product = {
    tableName: "p_product",
    columns: {
        id: "id",
        groupId: "group_id",
        name: "name",
        imagePaths: "image_paths",
        requiredAttr: "required_attr",
        attributes: "attributes",
        desc: "desc",
        hidden: "hidden",
        deleted: "deleted"
    }
};
BaseModel.product = product;
var group = {
    tableName: "p_group",
    columns: {
        id: "id",
        parentId: "parent_id",
        name: "name",
        icon: "icon",
        desc: "desc",
        hidden: "hidden",
        deleted: "deleted"
    }
};
BaseModel.group = group;
var discount = {
    tableName: "p_discount",
    columns: {
        id: "id",
        name: "name",
        type: "type",
        operator: "operator",
        condition: "condition",
        unit: "unit",
        amount: "amount",
        validFrom: "valid_from",
        validTo: "valid_to",
        status: "status"
    }
};
BaseModel.discount = discount;
var orderGroup = {
    tableName: "c_order_group",
    columns: {
        id: "id",
        parentId: "parent_id",
        name: "name",
        icon: "icon",
        desc: "desc",
        hidden: "hidden",
        deleted: "deleted"
    }
};
BaseModel.orderGroup = orderGroup;
var orderDetail = {
    tableName: "c_order_detail",
    columns: {
        id: "id",
        orderId: "order_id",
        productId: "product_id",
        status: "status"
    }
};
BaseModel.orderDetail = orderDetail;
var order = {
    tableName: "c_order",
    columns: {
        id: "id",
        groupId: "group_id",
        name: "name",
        desc: "desc",
        remarks: "remarks",
        createdBy: "created_by",
        createdAt: "created_at",
        updatedBy: "updated_by",
        lastUpdated: "last_updated",
        memberId: "member_id",
        discount: "discount",
        status: "status",
        paymentMethod1: "payment_method_1",
        paymentAmount1: "payment_amount_1",
        paymentMethod2: "payment_method_2",
        paymentAmount2: "payment_amount_2",
        paymentMethod3: "payment_method_3",
        paymentAmount3: "payment_amount_3"
    }
};
BaseModel.order = order;
var config = {
    tableName: "c_config",
    columns: {
        id: "id",
        name: "name",
        group: "group",
        attributes: "attributes"
    }
};
BaseModel.config = config;
