function TableComponent() {
    BaseTemplatedWidget.call(this);
    this.loadData(1);
}
__extend(BaseTemplatedWidget, TableComponent);

TableComponent.prototype.loadData = function(floorId) {
    // call service -> get data from API
    this.data = [
        { id: 1, name: "Ban 01" },
        { id: 2, name: "Ban 02" },
        { id: 3, name: "Ban 03" },
        { id: 4, name: "Ban 04" },
        { id: 5, name: "Ban 05" },
        { id: 6, name: "Ban 06" }
    ]
    this.install();
}

TableComponent.prototype.install = function() {
    // this.mainContentWrapper.setItems(this.data);
    Dom.empty(this.mainContentWrapper);
    for (var i in this.data) {
        if (typeof(this.data[i]) == "object") {
            var item = new TableItemView();
            item.render(this.data[i]);
            item.into(this.mainContentWrapper);
        }
    }
}

TableComponent.prototype.getStatus = function() {
    return {
        id: this.id,
        name: this.name,
        total: this.data.length,
        available: this.available.length
    };
}
