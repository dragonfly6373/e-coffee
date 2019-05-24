function MainApplication() {
    BaseTemplatedWidget.call(this);
    this.bind("click", function() {
        this.activePageCover(true);
        this.mainMenu.active(true);
    }, this.toggleMainMenuButton);
    this.bind("click", function() {
        if (this.mainMenu.isActive()) this.mainMenu.active(false);
        this.activePageCover(false);
    }, this.pageCover);
    //this.bind("p:deactivate", this.activePageCover.bind(this, false), this.mainMenu.node());
}
__extend(BaseTemplatedWidget, MainApplication);

MainApplication.prototype.onAttached = function() {
    var defaultPage = this.mainMenu.getPageById(this.mainMenu.getDefaultPageId());
    console.log("MainApplication is attached.", defaultPage);
    this.navigateTo(defaultPage);
    this.mainMenu.activeMenu(defaultPage.id);
}

MainApplication.prototype.activePageCover = function(isActive) {
    Dom.toggleClass(this.pageCover, "Activate", isActive);
}

MainApplication.prototype.navigateTo = function(component) {
    this.pageContentWrapper.launch(component);
}
