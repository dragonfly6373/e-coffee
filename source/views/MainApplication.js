function MainApplication() {
    BaseTemplatedWidget.call(this);
    this.bind("click", function() {
        this.activeMainMenu(true);
    }, this.toggleMainMenuButton);
    this.bind("click", function() {
        this.activeMainMenu(false);
    }, this.pageCover);
    this.bind(MainMenu.DEACTIVATE_EVENT, this.activeMainMenu.bind(this, false), this.mainMenu);
    this.bind(MainMenu.ACTIVE_COMPONENT_EVENT, function(event) {
        console.log("Navigate to:", event);
    }, this.mainMenu);
}
__extend(BaseTemplatedWidget, MainApplication);

MainApplication.prototype.onAttached = function() {
    var defaultPage = this.mainMenu.getPageById(this.mainMenu.getDefaultPageId());
    console.log("MainApplication is attached.", defaultPage);
    this.navigateTo(defaultPage);
    this.mainMenu.activeMenu(defaultPage.id);
}

MainApplication.prototype.activeMainMenu = function(isActive) {
    console.log("Active Main Menu:", isActive);
    this.mainMenu.active(isActive);
    Dom.toggleClass(this.pageCover, "Activate", isActive);
}

MainApplication.prototype.navigateTo = function(component) {
    this.pageContentWrapper.launch(component);
}
