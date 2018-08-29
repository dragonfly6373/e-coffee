function ComboManager() {
    BaseTemplatedWidget.call(this);
    this.button = this.node();
    this.button.setAttribute("type", "button");

    this.popup.setPopupClass("ComboManagerPopup");
    this.useHtml = false;

    this.renderer = ComboManager.DEFAULT_RENDERER;
    this.comparer = Util.sameId;
    this.bind("click", function () {
        if (this.popup != null && this.popup.isVisible()) {
            this.popup.hide();
            return;
        }
        this.show();
    }, this.button);
    this.bind("click", this.onItemClick, this.list);
    this.bind("keypress", this._handleKeyPress.bind(this), this.button);
    this.bind("p:PopupShown", function () {
        this.button.setAttribute("active", true);
        this.invalidateSelectItem();
    }, this.popup);
    this.bind("p:PopupHidden", function () {
        this.button.removeAttribute("active");
    }, this.popup);

    //Only handle up & down so used keydown
    this.bind("keydown", this._handleKeyEvent.bind(this), this.focusControl());
    var thiz = this;
    this.popup.shouldCloseOnBlur = function(event) {
        var found = Dom.findUpward(event.target, function (node) {
            return node == thiz.button;
        });
        return !found;
    };

}
__extend(BaseTemplatedWidget, ComboManager);
ComboManager.prototype.onDetached = function() {
    if (this.popup) {
        this.popup.kill();
    }
}
ComboManager.prototype.focusControl = function() {
    return this.button;
}
ComboManager.prototype.show = function() {
    this.popup.setMinWidth(this.getMinimumWidth());
    this.popup.show(this.button, "left-inside", "bottom", 0, 5, "autoFlip");
}
ComboManager.DEFAULT_RENDERER = function (item) {
    return "" + item;
};
ComboManager.prototype.getMinimumWidth = function() {
    return this.button.offsetWidth;
}
ComboManager.prototype.invalidateSelectItem = function() {
    var thiz = this;
    var node = null;
    Dom.doOnChildRecursively(this.list, function (n) {
        return n && n._data;
    }, function (n) {
        var data = n._data;
        var s = thiz.getSelectedItem();
        var ok = s && thiz.comparer && thiz.comparer(s, data);
        if (ok) {
            Dom.addClass(n, "Selected");
            node = n;
        } else {
            Dom.removeClass(n, "Selected");
        }
    });
    if (node) {
        var top = 0;
        for (var i = 0; i < this.list.childNodes.length; i++) {
            var item = this.list.childNodes[i];
            if (this.comparer && this.comparer(item._data,node._data)) {
                break;
            }
            top += Dom.getOffsetHeight(item);
        }
        var nH = Dom.getOffsetHeight(node);
        var lH = Dom.getOffsetHeight(this.list);
        this.list.scrollTop = top - ((lH - nH)/2);
    }
}
ComboManager.prototype.onItemClick = function (event) {
    var item = Dom.findUpwardForData(event.target, "_data");
    if (typeof(item) == "undefined") return;

    this.selectItem(item, true);
};
ComboManager.prototype.setItems = function (items, noSelectFirst) {
    var first = undefined;
    this.items = items;
    this.list.innerHTML = "";
    if (!this.items) return;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var element = this.renderer(item);
        var node = null;
        if (element.getAttribute) {
            node = Dom.newDOMElement({
                _name: "div",
                "class": "Item",
            });
            node.appendChild(element);
        } else {
            var spec = {
                _name: "div",
                "class": "Item",
                _text: element
            };

            spec[this.useHtml ? "_html" : "_text"] = element;
            node = Dom.newDOMElement(spec);
        }
        if (this.decorator) this.decorator(node, item);
        node._data = item;
        this.list.appendChild(node);
        if (typeof(first) == "undefined") first = item;
    }
    var selectFirst = typeof(noSelectFirst) === "undefined";
    if (selectFirst) {
        this.selectItem(first);
    }
};

ComboManager.prototype.selectItem = function (item, fromUserAction, noNeedChangeCurrentText) {
    // var element = this.renderer(item, "forCurrentItemDisplay");
    if (typeof(item) == "undefined") {
        this.selectedItem = undefined;
        this.invalidateSelectItem();
        this.fireSelectionEvent(fromUserAction);
        return;
    }

    var element = this.getDisplayValue(item);
    if (!element) return;

    if (typeof(noNeedChangeCurrentText) == "undefined") {
        if (element.getAttribute) {
            Dom.empty(this.buttonDisplay);
            this.buttonDisplay.appendChild(element);
        } else {
            this.buttonDisplay.innerHTML = this.useHtml ? element : Dom.htmlEncode(element);
            this.button.setAttribute("title", Dom.htmlEncode(this.useHtml ? Dom.htmlStrip(element) : element));
        }
    }
    if (this.decorator != null) {
        this.decorator(this.buttonDisplay, item);
    }
    this.selectedItem = item;

    if (fromUserAction) {
        this.popup.hide();
    } else {
        this.invalidateSelectItem();
    }
    this.fireSelectionEvent(fromUserAction);
};
ComboManager.prototype.getDisplayValue = function(item) {
    return this.renderer(item, "forCurrentItemDisplay");
}
ComboManager.prototype.selectItemByKey = function (keyName, keyValue) {
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i] && this.items[i][keyName] == keyValue) {
            this.selectItem(this.items[i]);
            return;
        }
    }
};
ComboManager.prototype.getSelectedItem = function () {
    return this.selectedItem;
};
ComboManager.prototype.setDisabled = function (disabled) {
    if (disabled == true) {
        this.button.setAttribute("disabled", "true");
    } else {
        this.button.removeAttribute("disabled");
    }
};
ComboManager.prototype.selectItemIfContains = function (selectedItem) {
    var item = null;
    var found = false;
    for (var i = 0; i < this.items.length; i ++) {
        if (this.comparer && this.comparer(selectedItem, this.items[i])) {
            item = this.items[i];
            found = true;
            break;
        }
    }

    if (found) {
        this.selectItem(item);
        return true;
    }

    return false;
};
ComboManager.prototype.getCurrentItemDisplayText = function (item) {
    return this.useHtml ? Dom.htmlStrip(this.renderer(item, "forCurrentItemDisplay")) : this.renderer(item, "forCurrentItemDisplay");
};
ComboManager.prototype.fireSelectionEvent = function (fromUserAction) {
    Dom.emitEvent("p:ItemSelected", this.node(), {fromUser: fromUserAction ? true : false});

    if (this.options && this.options.onItemSelected) {
        this.options.onItemSelected(fromUserAction ? true : false);
    }
};
ComboManager.prototype.setEnable = function (enable) {
    this.setDisabled(!enable);
};
ComboManager.prototype._handleKeyPress = function (event) {
    var keyCode = event.charCode;
    if ((keyCode > 47 && keyCode < 58)
        || (keyCode > 64 && keyCode < 91)
        || (keyCode > 95 && keyCode < 122)) {
        var now = new Date().getTime();
        var delta = now - (this.lastKeyPressTime || 0);
        if (!this.prefix || delta > 1000) {
            this.prefix = String.fromCharCode(event.charCode);
        } else {
            this.prefix += String.fromCharCode(event.charCode);
        }
        this.lastKeyPressTime = now;
        var found = false;
        for (var i = 0; i < this.list.childNodes.length; i ++) {
            var node = this.list.childNodes[i];
            if (!found && node.textContent && node.textContent.trim().toLowerCase().indexOf(this.prefix.trim().toLowerCase()) == 0) {
                var item = Dom.findUpwardForData(node, "_data");
                if (typeof(item) == "undefined") return;
                this.selectItem(item, !this.popup.isVisible());
                break;
            }
        }
        Dom.cancelEvent(event);
    }
};

ComboManager.prototype._handleKeyEvent = function(event) {
    if (typeof(event) == "undefined") return;

    switch (event.keyCode) {
        case DOM_VK_DOWN:
        var item = this.getSelectedItem();
        var nextItem = this.findNext(item);
        if (nextItem) {
            this.selectItem(nextItem, false);
        } else {
            var start = this.items && this.items.length > 0 ? this.items[0] : undefined;
            this.selectItem(start, false);
        }
        Dom.cancelEvent(event);
        break;

        case DOM_VK_UP:
        var item = this.getSelectedItem();
        var prevItem = this.findPrev(item);
        if (prevItem) {
            this.selectItem(prevItem, false);
        } else {
            var start = this.items && this.items.length > 0 ? this.items[0] : undefined;
            this.selectItem(start, false);
        }
        Dom.cancelEvent(event);
        break;

        case DOM_VK_ENTER:
        case DOM_VK_RETURN:

            if (!this.popup.isVisible()) {
                this.show();
            } else {
                var item = this.getSelectedItem();
                this.selectItem(item, true);
            }
            Dom.cancelEvent(event);
        break;

        default:
        break;
    }
}
ComboManager.prototype.findNext = function(current) {
    if (!this.items || this.items.length == 0) return undefined;
    var index = this.getIndex(current, this.items);
    if (index >= 0) {
        var next = index + 1 >= this.items.length ? 0 : index + 1;
        return this.items[next];
    } else {
        return undefined;
    }
}

ComboManager.prototype.findPrev = function(current) {
    if (!this.items || this.items.length == 0) return undefined;
    var index = this.getIndex(current, this.items);
    if (index >= 0) {
        var prev = index - 1 < 0 ? this.items.length - 1  : index - 1;
        return this.items[prev];
    } else {
        return undefined;
    }
}
ComboManager.prototype.getIndex = function(current, items) {
    var index = -1;
    if (current) {
        for (var i = 0; i < items.length; i ++) {
            if (this.comparer && this.comparer(current, items[i])) {
                index = i;
                break;
            }
        }
    }
    return index;
}
