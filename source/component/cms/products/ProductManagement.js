function ProductManagement() {
    BaseTemplatedWidget.call(this);
}
__extends(BaseTemplatedWidget, ProductManagement);

ProductManagement.prototype.onAttached = function() {
    console.log("ProductManagement: attached");
}
