function ModificationWatchDialog() {
    Dialog.call(this);

    this.modified = false;
    this._snapshotInputValues = null;

    var checkModifiedEvent = function(event) {
        if (!this.unsavedChangeListenerRegistered) return;

        if (typeof(event.fromUser) != "undefined") {
            if (!event.fromUser) return;
        }

        if (this._snapshotInputValues === null) {
            this.showUnsavedNotify();
            return;
        }
        if (this.hasInputValuesChanged()) {
            this.showUnsavedNotify();
        } else {
            this.clearUnsavedNotify();
        }
    };

    var names = this.getChangeEventNames();
    for (var i = 0; i < names.length; i ++) {
        this.bind(names[i], checkModifiedEvent, this.dialogBody);
    }
    this.unsavedChangeListenerRegistered = true;
}
__extend(Dialog, ModificationWatchDialog);

ModificationWatchDialog.prototype.getDialogActions = function () {
    if (!this.modified) {
        if (this.isEmbedded()) return [];
        return [{
            type: "cancel", title: "Close",
            isCloseHandler: true,
            run: function () { return true; }
        }];
    }

    var thiz = this;
    return [
        {
            type: "accept", title: "Save",
            run: function () { this.save(function (data) {
                thiz.close(data);
            }); return false; }
        },
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { this.performCancel(); return false; }
        }
    ]
};

ModificationWatchDialog.prototype.onInvalidateElements = function () {
    if (this.modified) {
        this.dialogFooterMiddlePane.appendChild(Dom.newDOMElement({
            _name: "span",
            "class": "ModifiedIndicator",
            _text: "Unsaved changes"
        }));
    }
};
ModificationWatchDialog.prototype.performCancel = function (data) {
    if (!this.modified) {
        this.close(data);
    } else {
        var thiz = this;
        Dialog.confirm("", "Are you sure you want to discard the unsaved changes?", "Discard changes", function () {
            thiz.close(data);
        }, "Cancel");
    }
};
ModificationWatchDialog.prototype.emitChangeEvent = function () {
    Dom.emitEvent(ModificationWatchDialog.DEFAULT_CHANGE_EVENT_NAME, this.dialogBody);
};
ModificationWatchDialog.DEFAULT_CHANGE_EVENT_NAME = "p:Modified";
ModificationWatchDialog.ALL_CHANGE_EVENT_NAMES = [ModificationWatchDialog.DEFAULT_CHANGE_EVENT_NAME, "input", "change", "p:ItemSelected", "p:ValueChanged", "p:SelectionChanged"];
ModificationWatchDialog.prototype.getChangeEventNames = function () {
    return [ModificationWatchDialog.DEFAULT_CHANGE_EVENT_NAME];
};

ModificationWatchDialog.prototype.registerUnsavedChanges = function(ablebility) {
    this.unsavedChangeListenerRegistered = (ablebility == void 0) ? true : ablebility;
};
ModificationWatchDialog.prototype.showUnsavedNotify = function () {
    if (this.modified === true) return;
    this.modified = true;
    this.invalidateElements();
};
ModificationWatchDialog.prototype.clearUnsavedNotify = function () {
    if (!this.modified) return;
    this.modified = false;
    this.invalidateElements();
};
ModificationWatchDialog.prototype.toggleUnsavedNotify = function (inputKey, originalValue, value) {
    if (typeof (this._changedInputMap) == "undefined") this._changedInputMap = {};
    var v1 = originalValue && typeof(originalValue) == "object" ? JSON.stringify(originalValue) : originalValue;
    var v2 = value && typeof(value) == "object" ? JSON.stringify(value) : value;
    if (v1 != v2) {
        this._changedInputMap[inputKey] = 1;
    } else {
        delete this._changedInputMap[inputKey];
    }
    var hasChanged = false;
    for (var k in this._changedInputMap) {
        hasChanged = true;
        break;
    }

    if (hasChanged) {
        this.showUnsavedNotify();
    } else {
        this.clearUnsavedNotify();
    }

    return hasChanged;
}
ModificationWatchDialog.prototype.setSnapshotInputValues = function(values) {
    if(values && typeof (values) == "object") {
        this._snapshotInputValues = JSON.parse(JSON.stringify(values));
    } else {
        this._snapshotInputValues = values;
    }
};
ModificationWatchDialog.prototype.getCurrentInputValues = function() {
    console.log("ModificationWatchDialog > getCurrentInputValues");
    return {};
};
ModificationWatchDialog.prototype.hasInputValuesChanged = function(values) {
    var curValues = values || this.getCurrentInputValues() || {};
    var snapshotValues = this._snapshotInputValues || {};
    return JSON.stringify(snapshotValues) !== JSON.stringify(curValues);
};
