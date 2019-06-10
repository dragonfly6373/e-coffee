function CategoryManagement() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, CategoryManagement);

CategoryManagement.prototype.onAttached = function() {
    console.log("CategoryManagement Attached");
}
