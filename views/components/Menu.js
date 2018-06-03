function Menu() {
	BaseTemplatedWidget.call(this);
    this._active = false;
    this._currentActive = null;
    this.bind("click", this.active.bind(this, false), this.closeButton);
	this.install(Menu.data);
}
__extend(BaseTemplatedWidget, Menu);

Menu.prototype.active = function(active) {
    if (active) {
        Dom.addClass(this.node(), "Activate");
        this._active = true;
    } else {
        Dom.removeClass(this.node(), "Activate");
        this._active = false;
        Dom.emitEvent("p:deactivate", this.node());
    }
}

Menu.prototype.isActive = function() {
    return this._active;
}

Menu.prototype.getDefaultPageId = function() {
    return "home";
}

Menu.prototype.getPageById = function(id) {
    return this[id];
}

Menu.prototype.install = function(data) {
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

Menu.prototype.activeMenu = function(id) {
    var menuItem = this[id];
    if (menuItem) {
        if (this._currentActive) Dom.removeClass(this._currentActive.__node, "Active");
        Dom.addClass(menuItem.__node, "Active");
    }
}

Menu.prototype.newMenuItem = function(data, className) {
    var class_name = "MenuItem" + (className ? " " + className : "");
    if (!data.implement && data.components) class_name += " Mute";
    var menuItem = Dom.newDOMElement({
        _name: "hbox",
        class: class_name,
        _style: data.style,
        _data: data,
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
    return menuItem;
}

Menu.data = [
    {
        components: [
            {
                id: "user_info",
                name: "User Info",
                icon: "information-outline",
                style: {},
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
                implementation: null
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
