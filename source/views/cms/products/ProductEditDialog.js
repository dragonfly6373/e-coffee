function ProductEditDialog() {
    Dialog.call(this);

}
__extends(Dialog, ProductEditDialog);

ProductEditDialog.prototype.setup = function(data) {
    if (data.id) {
        this.title = "Update Product";
    } else {
        this.title = "Create New Product";
    }
}
