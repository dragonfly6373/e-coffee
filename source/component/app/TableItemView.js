function TableItemView() {
    BaseTemplatedWidget.call(this);
    this.properties.populator = function(data, binding, node) {
        binding.icon = data.icon;
        binding.label = data.label;
    }
}
__extend(BaseTemplatedWidget, TableItemView);

TableItemView.prototype.render = function(data) {
    // console.log("TableItemView render", data);
    this.data = data;
    this.itemName.textContent = data.name;
    Dom.addClass(this.tableBody, "Available");
}
