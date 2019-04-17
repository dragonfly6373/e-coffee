function ChipList() {
    BaseTemplatedWidget.call(this);
    this.items = [];

    this.bind("p:ItemSelected", function () {
        var item = this.autoCompleteInput.getSelectedData();
        if (!item) return;
        this.add(item, "fromUser");
        this.autoCompleteInput.setSelectedData(null);
    }, this.autoCompleteInput);
    this.bind("keydown", this.handleKeyDown);
    this.bind("click", this.handleClick);
    this.setEnabled(true);
}

__extend(BaseTemplatedWidget, ChipList);

ChipList.prototype.setup = function (source, renderer) {
    this.source = source;
    this.renderer = renderer;

    this.autoCompleteInput.setup(source, renderer, renderer);
    this.autoCompleteInput.timeout = 50;
    // this.autoCompleteInput.suggestOnBlank = true;
    if (this.placeholder) this.autoCompleteInput.node().setAttribute("placeholder", this.placeholder);
};

ChipList.prototype.add = function (item, fromUserAction) {
    var view = this.createChipView(item);
    view._data = item;
    this.node().insertBefore(view, this.autoCompleteInput.node());
    Dom.emitEvent("p:ItemSelected", this.node(), {fromUser: fromUserAction ? true : false});
};

ChipList.prototype.createChipView = function (item) {
    return Dom.newDOMElement({
        _name: "hbox",
        "class": "Item",
        tabindex: 0,
        _children: [
            {_name: "span", _text: this.renderer(item)},
            {_name: "icon", "class": "close-circle CloseIcon"}
        ]
    });
};
ChipList.prototype.getItems = function () {
    var items = [];
    for (var i = 0; i < this.node().childNodes.length; i ++) {
        var node = this.node().childNodes[i];
        if (node._data) items.push(node._data);
    }

    return items;
};
ChipList.prototype.setItems = function (items) {
    var chips = [];
    for (var i = 0; i < this.node().childNodes.length; i ++) {
        var node = this.node().childNodes[i];
        if (!node._data || !Dom.hasClass(node, "Item")) continue;
        chips.push(node);
    }
    for (var i = 0; i < chips.length; i ++) this.node().removeChild(chips[i]);
    for (var i = 0; i < items.length; i ++) this.add(items[i]);
};
ChipList.prototype.handleKeyDown = function (event) {
    if ("false" == this.node().getAttribute("active")) return;

    if (event.target == this.autoCompleteInput.node()) {
        if (event.keyCode == DOM_VK_BACK_SPACE || event.keyCode == DOM_VK_LEFT) {
            if (this.autoCompleteInput.getText() != "") return;
            Dom.cancelEvent(event);
            var prev = this.autoCompleteInput.node().previousSibling;
            if (prev) prev.focus();
            return;
        }
    } else {
        var chip = Dom.findUpwardForNodeWithData(event.target, "_data");
        if (!chip || !Dom.hasClass(chip, "Item")) return;

        if (event.keyCode == DOM_VK_DELETE || event.keyCode == DOM_VK_BACK_SPACE) {
            chip.parentNode.removeChild(chip);
            this.autoCompleteInput.node().focus();
            Dom.emitEvent("p:ValueChanged", this.node(), {fromUser: true});
            return;
        }
        if (event.keyCode == DOM_VK_LEFT) {
            var prev = chip.previousSibling;
            if (prev && prev._data) prev.focus();
            return;
        }
        if (event.keyCode == DOM_VK_RIGHT) {
            var next = chip.nextSibling;
            if (next) next.focus()
            return;
        }
    }
};

ChipList.prototype.setEnabled = function(enable) {
    Dom.setEnabled(enable, this.autoCompleteInput);
    this.node().setAttribute("active", enable);
}

ChipList.prototype.handleClick = function (event) {
    if ("false" == this.node().getAttribute("active")) return;

    if (event.target == this.autoCompleteInput.node()) {
        this.autoCompleteInput.autoCompleteNow();
    } else {
        var icon = Dom.findParentWithClass(event.target, "CloseIcon");
        if (!icon) return;
        var chip = Dom.findUpwardForNodeWithData(event.target, "_data");
        if (!chip || !Dom.hasClass(chip, "Item")) return;

        chip.parentNode.removeChild(chip);
        Dom.emitEvent("p:ValueChanged", this.node(), {fromUser: true});
        this.autoCompleteInput.node().focus();
    }
};
