function ProgressBar() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, ProgressBar);

ProgressBar.prototype.setProgress = function (percent, message) {
    if (typeof(percent) == "undefined") {
        this.setMessage(message);
        return;
    }
    Dom.addClass(this.container, "ProgressOnly");
    this.progressBarInner.style.width =  percent + "%";
    this.statusLabel.innerHTML = Dom.htmlEncode(message || "Please wait...");
}
ProgressBar.prototype.setMessage = function(message) {
    this.statusLabel.innerHTML = Dom.htmlEncode(message || "Please wait...");
    Dom.removeClass(this.container, "ProgressOnly");
}
