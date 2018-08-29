function ImageView(node) {
    BaseTemplatedWidget.call(this);
    ImageView.instance = this;

    this.url = node.getAttribute("url") || "";
    if (this.url.length) this.pending = true;
    this.centerCrop = node.getAttribute("crop-center") || true;
    this.notUpscale = node.getAttribute("notUpscale") || true;

    this.bind("load", function () {
        this.imageSize = {
            w: this.image.naturalWidth,
            h: this.image.naturalHeight
        };
        Util.cropImage(this.image, this.centerCrop, this.notUpscale);
        Dom.emitEvent("p:ImageSizeAvailable", this.node(), {});

        if (this._indicator && this._indicator.done) {
            this._indicator.done();
        }
    }, this.image);

    this.bind("error", function () {
        if (this._indicator && this._indicator.done) {
            this._indicator.done();
        }
        this.imageSize = null;
        if (this.retried || !this.fallbackUrl) return;
        this.retried = true;
        this.image.src = this.fallbackUrl;

    }, this.image);
}
__extend(BaseTemplatedWidget, ImageView);

ImageView.prototype.setCenterCrop = function(centerCrop) {
    this.centerCrop = centerCrop;
};

ImageView.prototype.setIndicator = function(indicator) {
    this._indicator = indicator;
};

ImageView.prototype.setNotUpscale = function(notUpscale) {
    this.notUpscale = notUpscale;
};

ImageView.prototype.setUrl = function(url, fallbackUrl) {
    this.imageSize = null;
    this.url = url;
    this.fallbackUrl = fallbackUrl;
    if (this.fallbackUrl) this.retried = false;

    if (this.attached) {
        this.startLoading();
    } else {
        this.pending = true;
    }
};

ImageView.prototype.startLoading = function() {
    this.pending = false;
    this.image.style.display = "none";
    this.image.src = this.url;
    if (this._indicator && this._indicator.busy) this._indicator.busy();
};

ImageView.prototype.onAttached = function() {
    this.attached = true;
    if (this.pending) this.startLoading();
};
ImageView.prototype.getImageSize = function() {
    return this.imageSize;
};
