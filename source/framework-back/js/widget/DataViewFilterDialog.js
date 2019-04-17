function DataViewFilterDialog() {
    Dialog.call(this);
    this.title = "Customize Filters";
}

__extend(Dialog, DataViewFilterDialog);

DataViewFilterDialog.prototype.setup = function (options) {
    this.filterView.setFilterList(options.spec.filters.filter(function (f) {
        return !f.instantFilterOnly;
    }), options.valueMap);
};

DataViewFilterDialog.prototype.getDialogActions = function () {
    return [
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {
            type: "accept", title: "Apply",
            run: function () { this.apply(); return false; }
        }, {
            type: "extra1", title: "Clear Filters",
            run: function () {
                this.filterView.clearFilters();
            }
        }
    ]
};

DataViewFilterDialog.prototype.apply = function () {
    this.close(this.filterView.getValueMap());
};
