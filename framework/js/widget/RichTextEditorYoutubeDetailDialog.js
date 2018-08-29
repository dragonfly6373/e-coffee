function RichTextEditorYoutubeDetailDialog() {
    Dialog.call(this);

    this.title = "Insert Youtube Video";
    this.videoSizeSelector.renderer = function (size) {
        return size.w + " x " + size.h;
    };
    this.videoSizeSelector.comparer = Util.sameId;
    this.videoSizeSelector.setItems(RichTextEditorYoutubeDetailDialog.SIZES);
}
__extend(Dialog, RichTextEditorYoutubeDetailDialog);

RichTextEditorYoutubeDetailDialog.SIZES = [
    {id: "426x240", w: 426, h: 240},
    {id: "640x360", w: 640, h: 360},
    {id: "854x480", w: 854, h: 480},
    {id: "1280x720", w: 1280, h: 720},
]
RichTextEditorYoutubeDetailDialog.prototype.onShown = function () {
    this.youtubeIdInput.focus();
};
RichTextEditorYoutubeDetailDialog.prototype.setup = function (video) {
    if (video) {
        this.youtubeIdInput.value = video.id;
        var sizeId = video.width + "x" + video.height;
        this.videoSizeSelector.selectItemByKey("id", sizeId);
    } else {
        this.videoSizeSelector.selectItemByKey("id", "640x360");
    }
};


RichTextEditorYoutubeDetailDialog.prototype.getDialogActions = function () {
    return [
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {
            type: "accept", title: "OK",
            run: function () { this.onAccept(); return false; }
        }
    ]
};
RichTextEditorYoutubeDetailDialog.prototype.onAccept = function () {
    var id = RichTextEditorYoutubeDetailDialog.parseId(this.youtubeIdInput.value) || this.youtubeIdInput.value;
    if (!id) {
        Dialog.error("Invalid video", "Please enter a valid Youtube video URL or ID.", function () {
            this.youtubeIdInput.focus();
        }.bind(this));
        return;
    }
    
    var size = this.videoSizeSelector.getSelectedItem();
    
    this.close({
        id: id,
        width: size.w,
        height: size.h
    });
};

RichTextEditorYoutubeDetailDialog.parseId = function (url) {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return (url.match(p)) ? RegExp.$1 : null;
}
