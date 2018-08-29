function DynamicComboManager() {
    ComboManager.call(this);
    this.bind("change", this.invalidateShowContentPreview, this.showContentCheckBox);
    this.invalidateShowContentPreview();
    //this.bind("keypress", this._handleKeyPress.bind(this), this.termInput);
    this.bind("input", this.search, this.termInput);
    this.bind("change", this.search, this.termInput);

    this.bind("p:PopupShown", function () {
        this.termInput.value = "";
        this.termInput.focus();
        Dom.addClass(this.contentBox, "Active");
        Dom.addClass(this.list, "Active");
        Dom.addClass(this.popup.popupContainer, "Shown");
        this.searchImpl(typeof (this.source.getSelectedItem()) === "undefined");
    }, this.popup);
    this.bind("p:PopupHidden", function (ev) {
        Dom.removeClass(this.contentBox, "Active");
        Dom.removeClass(this.list, "Active");
        Dom.removeClass(this.popup.popupContainer, "Shown");
        delete this._searchTask;
    }, this.popup);
    this.popup.setPopupClass("DynamicComboManagerPopup");
    this.bind("p:ItemSelected", function() {
        this.showPreviewIfNeeded();
    }, this.node());
}
__extend(ComboManager, DynamicComboManager);

DynamicComboManager.prototype.focusControl = function() {
    return this.termInput;
}

DynamicComboManager.prototype.selectItem = function (item, fromUserAction) {
    ComboManager.prototype.selectItem.call(this, item, fromUserAction, !fromUserAction && this.popup.isVisible() ? "yes" : undefined);
}

DynamicComboManager.prototype.showPreviewIfNeeded = function() {
    var item = this.getSelectedItem();
    var isPreview = item && this._preview && this._previewItem && this.comparer && this.comparer(item, this._previewItem);
    if (isPreview) {
        return;
    }
    this.contentPreview.innerHTML = "";
    if (!this.showContentCheckBox.checked
        || !this.popup.isVisible() || !this.source || !this.source.getPreviewContent) {
        delete this._previewItem;
        delete this._preview;
        return;
    }
    if (this._previewTask) window.clearTimeout(this._previewTask);
    var thiz = this;
    this._previewTask = window.setTimeout(function(){
        delete thiz._previewTask;
        var pv = thiz.source.getPreviewContent(item);
        if (!pv) {
            delete thiz._previewItem;
            delete thiz._preview;
            return;
        }
        pv.into(thiz.contentPreview);
        thiz._previewItem = item;
        thiz._preview = pv;
    }, 300);



}
DynamicComboManager.prototype.setSource = function(source) {
    this.source = source;
    if (!this.popup.isVisible()) {
        this.searchImpl(typeof (this.source.getSelectedItem()) === "undefined");
    }
}

DynamicComboManager.prototype.search = function() {
    if (!this.source) return;
    var thiz = this;
    if (thiz._searchTask) {
        window.clearTimeout(thiz._searchTask);
    }
    this._searchTask = window.setTimeout(function () {
        thiz.searchImpl();
    }, 250);
}
DynamicComboManager.prototype.searchImpl = function(forceSelectFirst) {
    var thiz = this;
    var term = thiz.termInput.value.trim();
    if (!this.source.getItems) return;
    this.source.getItems(term, function(items) {
        var selected = thiz.source.getSelectedItem();
        if (forceSelectFirst || !selected) {
            thiz.setItems(items);
        } else {
            thiz.setItems(items, "noSelectFirst");
        }
        var index = thiz.getIndex(selected, items);
        if (index >= 0) {
            thiz.selectItemIfContains(selected);
        } else {
            thiz.selectItem((forceSelectFirst && items && items.length > 0) ? items[0] : undefined, false);
        }
    });
}

DynamicComboManager.prototype.invalidateShowContentPreview = function() {
    var show = this.showContentCheckBox.checked;
    if (show) {
        Dom.addClass(this.contentPreview, "Active");
        Dom.addClass(this.list, "PreviewMode");
    } else {
        Dom.removeClass(this.contentPreview, "Active");
        Dom.removeClass(this.list, "PreviewMode");
    }
    if (show) {
        this.showPreviewIfNeeded();
    }
    if (this.popup.isVisible()) {
        this.popup.setMinWidth(this.getMinimumWidth());
        this.popup.invalidatePosition();
    }
    this.termInput.focus();
}
DynamicComboManager.prototype.getMinimumWidth = function() {
    var show = this.showContentCheckBox.checked;
    return show ? this.button.offsetWidth * 1.3 : this.button.offsetWidth;
}
