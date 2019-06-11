function MainMenu() {
	BaseTemplatedWidget.call(this);
    var thiz = this;
    this._active = false;
    this._currentActive = null;
    this.bind("click", this.active.bind(this, false), this.closeButton);
    this.bind("click", function(event) {
        var menuItem = Dom.findUpwardForNodeWithData(event.target, "_data");
        thiz.activeMenu(menuItem);
    }, this.mainMenuContainer);
}
__extend(BaseTemplatedWidget, MainMenu);
MainMenu.DEACTIVATE_EVENT = "ui:deactivate";
MainMenu.ACTIVE_COMPONENT_EVENT = "ui:component_change";

MainMenu.prototype.onAttached = function() {
    this.install(MainMenu.data);
    if (!this._currentActive) {
        var menuItem = this.getPageById(this.getDefaultPageId()).__node;
        this.activeMenu(menuItem);
    }
}

MainMenu.prototype.active = function(active) {
    console.log("Active MainMenu:", this._active, active);
    if (active) {
        Dom.addClass(this.node(), "Activate");
        this._active = true;
    } else if (this._active) {
        Dom.removeClass(this.node(), "Activate");
        this._active = false;
        Dom.emitEvent(MainMenu.EMIT_DEACTIVATE_EVENT, this.node());
    }
}

MainMenu.prototype.getDefaultPageId = function() {
    return "home";
}

MainMenu.prototype.getPageById = function(id) {
    return this[id];
}

MainMenu.prototype.setTargetContainer = function(container) {
    this.container = container;
}

MainMenu.prototype.activeMenu = function(menuItem) {
    console.log("Active Menu:", menuItem);
    var thiz = this;
    if (menuItem) {
        var data = menuItem._data;
        if (this._currentActive && this._currentActive._data.id != menuItem._data.id) {
            Dom.removeClass(this._currentActive, "Active");
            this._currentActive = menuItem;
        }
        if (!data || !(data.implementation || data.src)) data = {implementation: ConstructionWidget};
        this.container.launch(data, null, () => {
            Dom.addClass(thiz._currentActive, "Active");
            thiz.active(false);
        });
    }
}

MainMenu.prototype.install = function(data) {
	for (i in data) {
        var menu = data[i];
        if (menu.name) {
            var menuItem = this.newMenuItem(menu, "MainMenu");
            this.mainMenuContainer.appendChild(menuItem);
            menu.__node = menuItem;
            this[menu.id] = menu;
        }
        if (menu.components && menu.components.length > 0) {
            var w = Dom.newDOMElement({
                _name: "vbox",
                class: "MenuGroup"
            });
            for (var i in menu.components) {
                var menuItem = this.newMenuItem(menu.components[i], "SubMenu");
                w.appendChild(menuItem);
                menu.__node = menuItem;
                this[menu.id] = menu;
            }
            this.mainMenuContainer.appendChild(w);
        }
    }
}

MainMenu.prototype.newMenuItem = function(data, className) {
    var class_name = "MenuItem" + (className ? " " + className : "");
    if (!data.implement && data.components) class_name += " Mute";
    var menuItem = Dom.newDOMElement({
        _name: "hbox",
        class: class_name,
        _style: data.style,
        _children: [
            {
                _name: "icon",
                class: data.icon
            },
            {
                _name: "span",
                class: "Title",
                _text: data.name
            }
        ]
    });
    menuItem._data = data;
    return menuItem;
}

MainMenu.data = [
    {
        components: [
            {
                id: "user_info",
                name: "User Info",
                icon: "information-outline",
                implementation: null
            }, {
                id: "logout",
                name: "Logout",
                icon: "logout",
                style: "color: red",
                implementation: null
            }
        ]
    }, {
        id: "home",
        name: "Home",
        icon: "home",
        style: "color: blue",
        implementation: Home
    }, {
        components: [
            {
                id: "category",
                name: "Category",
                icon: "food",
                implementation: CategoryManagement
            }, {
                id: "floor_table",
                name: "Floor & Table",
                icon: "layers",
                implementation: null
            }, {
                id: "sync_data",
                name: "Sync Data",
                icon: "sync",
                implementation: null
            }, {
                id: "report",
                name: "Report",
                icon: "finance",
                implementation: null
            }
        ]
    }, {
        components: [
            {
                id: "setting",
                name: "Settings",
                icon: "settings",
                implementation: null
            }, {
                id: "appearance",
                name: "Appearance",
                icon: "palette",
                implementation: null
            }
        ]
    }, {
        id: "about",
        name: "About...",
        icon: "information-outline",
        implementation: null
    }
];
