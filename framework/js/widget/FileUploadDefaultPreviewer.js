function FileUploadDefaultPreviewer() {
    BaseTemplatedWidget.call(this);

}
__extend(BaseTemplatedWidget, FileUploadDefaultPreviewer);


FileUploadDefaultPreviewer.prototype.setFileInfo = function (fileInfo) {
    this.fileInfo = fileInfo;
    if (fileInfo.contentType.match(/^image\/.*$/)) {
        this.setupImageView();
    } else {
        this.setupRegularFileView();
    }
};

FileUploadDefaultPreviewer.prototype.setupImageView = function () {
    Dom.addClass(this.node(), "UseImage");

    console.log("setupImageView", this.fileInfo);
    if (typeof(this.fileInfo.centerCrop) != void 0) this.imageView.setCenterCrop(this.fileInfo.centerCrop);
    if (typeof(this.fileInfo.notUpscale) != void 0) this.imageView.setNotUpscale(this.fileInfo.notUpscale);

    if (this.fileInfo.url) {
        this.imageView.setUrl(this.fileInfo.url);
    } else if (this.fileInfo.file) {
        var reader = new FileReader();
        var thiz = this;
        reader.onload = function (e) {
            thiz.imageView.setUrl(e.target.result);
        };
        reader.readAsDataURL(this.fileInfo.file);
    }
};
FileUploadDefaultPreviewer.prototype.setupRegularFileView = function () {
    Dom.removeClass(this.node(), "UseImage");
    Dom.setInnerText(this.fileName, this.fileInfo.name);
    Dom.setInnerText(this.fileType, "Type: " + this.fileInfo.contentType);
    this.fileIcon.setAttribute("class", "file");
};
FileUploadDefaultPreviewer.prototype.getImageSize = function () {
    return this.imageView.getImageSize();
};