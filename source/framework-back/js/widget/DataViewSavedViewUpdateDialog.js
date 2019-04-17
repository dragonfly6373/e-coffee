function DataViewSavedViewUpdateDialog() {
    Dialog.call(this);
    this.title = "Save current view";

    this.bind("click", function () {
        this.nameInput.disabled = true;
    }, this.updateRadio);
    this.bind("click", function () {
        this.nameInput.disabled = false;
    }, this.createRadio);
}

__extend(Dialog, DataViewSavedViewUpdateDialog);

DataViewSavedViewUpdateDialog.prototype.setup = function (options) {
    this.savedView = options.savedView;
    console.log("savedView:", this.savedView);
    if (this.savedView.id && this.savedView.id > 0) {
        this.updateViewLabel.innerHTML = "Update '" + this.savedView.name + "'";
        this.updateRadio.checked = true;
        this.nameInput.disabled = true;
    } else {
        this.updateContainer.style.display = "none";
        this.createRadio.style.display = "none";
        this.createRadio.checked = true;
        this.newViewLabel.innerHTML = "Saved View Name:";
    }
};

DataViewSavedViewUpdateDialog.prototype.getDialogActions = function () {
    return [
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {
            type: "accept", title: "Save",
            run: function () { this.save(); return false; }
        }
    ]
};

DataViewSavedViewUpdateDialog.prototype.save = function () {
    var createNew = this.createRadio.checked;
    var thiz = this;
    if (createNew) {
        var viewName = this.nameInput.value;
        if (viewName == null || viewName.trim() == "") {
            Dialog.error("Please enter the saved view name.");
            return;
        }
        this.savedView.id = 0;
        this.savedView.name = viewName.trim();
        this.savedView.isDefault = false;

        $dataViewService.createSavedView(this.savedView, function (savedView) {
            thiz.close(savedView);
        });

    } else {
        $dataViewService.updateSavedView(this.savedView, function (savedView) {
            thiz.close(savedView);
        });
    }
};
