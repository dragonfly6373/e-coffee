function MainApplication() {
    BaseTemplatedWidget.call(this);
    console.log("MainApplication");
}
__extend(BaseTemplatedWidget, MainApplication);

MainApplication.prototype.onAttached = function() {
    console.log("MainApplication attached");
}
