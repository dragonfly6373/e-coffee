function FileUploadAudioPreviewer() {
    BaseTemplatedWidget.call(this);

}
__extend(BaseTemplatedWidget, FileUploadAudioPreviewer);


FileUploadAudioPreviewer.prototype.setFileInfo = function (fileInfo) {
    this.fileInfo = fileInfo;
    if (this.fileInfo.url) {
        this.audio.setAttribute("src", this.fileInfo.url);
    } else if (this.fileInfo.file) {
        var reader = new FileReader();
        var thiz = this;
        reader.onload = function (e) {
            thiz.audio.setAttribute("src", e.target.result);
        };
        reader.readAsDataURL(this.fileInfo.file);
    }
};
