function PageContentWrapper() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, PageContentWrapper);
PageContentWrapper.prototype.reset = function () {
    this.pageContainer.innerHTML = "";
    this.iframe.src = "about:blank";
    Dom.addClass(this.node(), "WidgetMode");
    Dom.removeClass(this.node(), "IFrameMode");
};
PageContentWrapper.prototype.launch = function (feature, preExecuteCallback,  callback) {
    this.indicator = AdminConsole.instance.asCustomIndicator("Loading " + feature.name + "...");
    var thiz = this;
    var next = function () {
        if (preExecuteCallback) preExecuteCallback();

        var f = feature.implementation;
        if (typeof(f) == "function") {
            this.pageContainer.innerHTML = "";
            var f = new f();
            this.featureWidget = f.into(this.pageContainer, feature.data);
            Dom.addClass(this.node(), "WidgetMode");
            Dom.removeClass(this.node(), "IFrameMode");
            if (f instanceof Dialog) {
                Dom.addClass(this.node(), "HostedDialog");
            } else {
                Dom.removeClass(this.node(), "HostedDialog");
            }
            
        } else if (f.src) {
            this.indicator.busy();
            Dom.addClass(this.node(), "IFrameMode");
            Dom.removeClass(this.node(), "WidgetMode");
            this.featureWidget = null;
            this.bind("load", function () {
                var thiz = this;
                if (this.indicator) {
                    this.indicator.done();
                }
                this.iframe.contentWindow.addEventListener("unload", function (event) {
                    thiz.indicator.busy();
                }, false);

            }, this.iframe);
            this.iframe.src = f.src;
            window.setTimeout(function(){
                thiz.indicator.done();
            }, 2000);
        }

        if (callback) callback(this.featureWidget);
    }.bind(this);

    if (this.featureWidget && this.featureWidget.confirmClosing) {
        this.featureWidget.confirmClosing(next);
    } else {
        next();
    }
};
