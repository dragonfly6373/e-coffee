function ProductEditDialog() {
    ModificationWatchDialog.call(this);
    this.validationRules = new RuleSet()
        .live(true)
        .required(this.itemName, "Please input 'Title'");
}
__extends(ModificationWatchDialog, ProductEditDialog);

ProductEditDialog.prototype.setup = function(id) {
    if (id) {
        this.title = "Update Product";
    } else {
        this.title = "Create New Product";
        // TODO: get product detail from service
    }
}

ProductEditDialog.prototype.getCurrentInputValue = function() {
    return {
        name: this.itemName.value,
        enabled: this.ckbEnable.checked,
        size: this.selectSizes.getSelectedValue(),
        descr: this.itemDescription.value
    };
}

ProductEditDialog.prototype.save = function() {
    if(!ValidationManager.run(this.validationRules)) return false;
    var values = this.getCurrentInputValue();
}

ProductEditDialog.prototype.getDialogActions = function() {
    return [
        {
            type: "accept", title: "Save",
            run: function () {
                this.save();
            return false; }
        },
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () {
                this.performCancel();
                return false;
            }
        }
    ]
}
