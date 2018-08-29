function ActionMenu(node) {
    BaseWidget.call(this);

    if (node) {
        var icon = node.getAttribute("icon");
        if (icon) {
            this.icon.setAttribute("class", icon);
        } else {
            this.icon.style.display = "none";
        }

        var label = node.getAttribute("label");
        Dom.setInnerText(this.label, label);
    }

    this.popup.setPopupClass("ActionMenuPopup");
    this.actions = [];
    this.groups = {};

    this.bind("click", this.handleMenuItemClick, this.container);

    this.bind("click", function () {
        this.invalidate();
        this.popup.show(this.node(), "left-inside", "bottom", 0, 5);
    });
}
__extend(BaseTemplatedWidget, ActionMenu);


ActionMenu.prototype.handleMenuItemClick = function (event) {
    var target = Dom.getTarget(event);
    var item = Dom.findUpward(target, {
        eval: function (n) {
            return n._action;
        }
    });

    if (!item) return;
    var action = item._action;
    var disabled = false;
    if (typeof action.applicable != "undefined") {
        disabled = !action.applicable || (typeof action.applicable == "function" && !action.applicable());
    }

    if (disabled) return;

    Dom.cancelEvent(event);
    this.popup.close();

    action.run();
}

ActionMenu.prototype.setTitle = function (title) {
    if (!title || (!title.label && !title.icon)) return;
    var icon = title.icon;
    if (icon) {
        this.icon.setAttribute("class", icon);
    } else {
        this.icon.style.display = "none";
    }

    var label = title.label;
    Dom.setInnerText(this.label, label);
}

ActionMenu.prototype.register = function (action) {
    this.actions.push(action);

    var actionGroup = (typeof action.group == "function" ? action.group() : action.group) || "No group";
    if (!this.groups[actionGroup]) {
        this.groups[actionGroup] = [];
    }
    this.groups[actionGroup].push(action);

    this.invalidate();
};
ActionMenu.prototype.invalidate = function () {
    this.container.innerHTML = "";
    var allDisabled = true;
    for (var groupName in this.groups) {
        var actions = this.groups[groupName];

        if (!actions || actions.length < 0) continue;

        var groupBox = document.createElement("vbox");
        Dom.addClass(groupBox, "Group");

        for (var i = 0; i < actions.length; i ++) {
            var action = actions[i];
            if (typeof action.visible != "undefined") {
                if (!action.visible || (typeof action.visible == "function" && !action.visible())) continue;
            }

            var disabled = false;
            if (typeof action.applicable != "undefined") {
                disabled = !action.applicable || (typeof action.applicable == "function" && !action.applicable());
            }

            var hbox = document.createElement("hbox");

            var html = "";
            if (action.icon) html += "<icon class=\"" + (typeof action.icon == "function" ? action.icon() : action.icon) + "\"></icon>";
            if (action.title) html += "<span>" + (typeof action.title == "function" ? action.title() : action.title) + "</span>";

            hbox.innerHTML = html;

            groupBox.appendChild(hbox);
            if (disabled) {
                Dom.addClass(hbox, "Disabled");
            } else {
                allDisabled = false;
            }
            hbox._action = action;
        }

        this.container.appendChild(groupBox);
    }

    this.node().disabled = allDisabled;
};
