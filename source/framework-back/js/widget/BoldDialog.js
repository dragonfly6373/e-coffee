function BoldDialog() {
    Dialog.call(this);
    this.bannerImageUrl = "/cms/admin/data/bold-dialog-default.jpg";
}
__extend(Dialog, BoldDialog);

BoldDialog.prototype.getDialogOverlayExtraClass = function () {
    return "BoldDialogOverlay";
};

BoldDialog.prototype.getFrameTemplate = function () {
    return BoldDialog.prototype.__pathPrefix + "BoldDialog.xhtml";
};
BoldDialog.prototype.getBannerImageUrl = function () {
    return this.bannerImageUrl;
};
BoldDialog.prototype.invalidateElements = function () {
    Dialog.prototype.invalidateElements.call(this);
    
    this.titleImage.src = this.getBannerImageUrl();
};
BoldDialog.prototype.getFrameOverflowStyle = function () {
    return "hidden";
};