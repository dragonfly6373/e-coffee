function MainApplication() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, MainApplication);

MainApplication.prototype.onAttached = function() {
    console.log("MainApplication is attached.");
}
