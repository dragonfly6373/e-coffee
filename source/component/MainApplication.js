function MainApplication() {
    BaseTemplatedWidget.call(this);
    this.bind("click", function() {
        this.activeMainMenu(true);
    }, this.toggleMainMenuButton);
    this.bind("click", function() {
        this.activeMainMenu(false);
    }, this.pageCover);
    this.bind(MainMenu.DEACTIVATE_EVENT, this.activeMainMenu.bind(this, false), this.mainMenu);
    this.mainMenu.setTargetContainer(this.pageContentWrapper);
}
__extend(BaseTemplatedWidget, MainApplication);

MainApplication.prototype.onAttached = function() {
    // var defaultPage = this.mainMenu.getPageById(this.mainMenu.getDefaultPageId());
    // console.log("MainApplication is attached.", defaultPage);
    // this.navigateTo(defaultPage);
    // this.mainMenu.activeMenu(defaultPage.id);
}

MainApplication.prototype.activeMainMenu = function(isActive) {
    console.log("Active Main Menu:", isActive);
    this.mainMenu.active(isActive);
    Dom.toggleClass(this.pageCover, "Activate", isActive);
}
