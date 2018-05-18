function Menu() {
	BaseTemplatedWidget.call(this);
    this._active = false;
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

Menu.prototype.install = function(data) {
	for (i in data) {
        var menu = data[i];
        if (menu.name) {
            var menuItem = this.newMenuItem(menu, "MainMenu");
            this.mainMenuContainer.appendChild(menuItem);
        }
        if (menu.components && menu.components.length > 0) {
            var w = Dom.newDOMElement({
                _name: "vbox",
                class: "MenuGroup"
            });
            for (var i in menu.components) {
                w.appendChild(this.newMenuItem(menu.components[i], "SubMenu"));
            }
            this.mainMenuContainer.appendChild(w);
        }
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
                implement: null
            }, {
                id: "logout",
                name: "Logout",
                icon: "logout",
                style: "color: red",
                implement: null
            }
        ]
    }, {
        id: "home",
        name: "Home",
        icon: "home",
        style: "color: blue",
        implement: null
    }, {
        components: [
            {
                id: "category",
                name: "Category",
                icon: "food",
                implement: null
            }, {
                id: "floor_table",
                name: "Floor & Table",
                icon: "layers",
                implement: null
            }, {
                id: "sync_data",
                name: "Sync Data",
                icon: "sync",
                implement: null
            }, {
                id: "report",
                name: "Report",
                icon: "finance",
                implement: null
            }
        ]
    }, {
        components: [
            {
                id: "setting",
                name: "Settings",
                icon: "settings",
                implement: null
            }, {
                id: "appearance",
                name: "Appearance",
                icon: "palette",
                implement: null
            }
        ]
    }, {
        id: "about",
        name: "About...",
        icon: "information-outline",
        implement: null
    }
];
