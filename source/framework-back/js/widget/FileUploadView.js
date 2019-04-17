function FileUploadView(node) {
    BaseTemplatedWidget.call(this);

    this.maxFiles = Dom.getAttributeAsInt(node, "max", 5);
    this.showSize = Dom.getAttributeAsBoolean(node, "show-size", true) && this.maxFiles == 1;
    
    this.acceptedExtensions = Dom.getAttributeAsString(node, "accept", "").toLowerCase().split(",");
    this.previewerConfig = {
        name: window[Dom.getAttributeAsString(node, "previewer", "FileUploadDefaultPreviewer")],
        image : {
            centerCrop: true,
            notUpscale: true
        }
    };
    var thiz = this;

    this.bind("drop", this.handleDrop);
    this.bind("dragover", this.handleDragOver);
    this.bind("dragend", this.handleDragEnd);

    this.bind("contextmenu", function (event) {event.preventDefault()});
    
    if (this.showSize) {
        this.bind("p:ImageSizeAvailable", function () {
            var size = this.getFirstImageSize();
            var text = "" + size.w + " x " + size.h;
            this.sizeText.innerHTML = text;
            this.sizeText.setAttribute("title", "Actual image size: " + text + " pixels.");
        });
        Dom.addClass(this.node(), "WithSizeInfo");
    } else {
        this.sizeText.innerHTML = "";
        this.sizeText.setAttribute("title", "");
    }

    if (!window.Clipboard) {
        this.pasteReceiver = this.node().ownerDocument.createElement("div");
        this.pasteReceiver.setAttribute("style", "position: absolute; top: 0px; left: 0px; width: 1px; height: 1px; opacity: 0; color: transparent; overflow: hidden;");
        this.pasteReceiver.setAttribute("contenteditable", "true");

        this.node().appendChild(this.pasteReceiver);

        this.pasteReceiver.addEventListener("focus", function () {
            Dom.addClass(thiz.node(), "PasteReceiverFocused");
        }, false);
        this.pasteReceiver.addEventListener("blur", function () {
            Dom.removeClass(thiz.node(), "PasteReceiverFocused");
        }, false);

        this.bind("focus", function() {
            this.pasteReceiver.innerHTML = "";
            this.pasteReceiver.focus();
        });

        this.pasteReceiver.addEventListener("paste", function (event) {
            window.setTimeout(function () {
                try {
                    var images = thiz.pasteReceiver.getElementsByTagName("img");
                    if (images && images.length > 0) {
                        var image = images[0];
                        var src = image.src;
                        if (src.substring(0, 5) != "data:") return;

                        var blob = Util.dataURIToBlob(src);
                        var name = "PastedImage" + Math.round(Math.random() * 1000000);
                        name += "." + (FileUploadView.MIME_REVERSED_MAP[blob.type] || "dat");
                        blob.name = name;

                        var added = thiz.addFile(blob, src);
                        if (added) {
                            thiz.invalidateStatus();
                            thiz.fireFileModified();
                        }
                    }
                } finally {
                    thiz.pasteReceiver.innerHTML = "";
                }
            }, 10);
        }, false);
    }

    this.bind("dragenter", function (e) {
        try {
            if (this.isFileDragging(e) && this.fileInfoList.length < this.maxFiles) {
                Dom.addClass(this.node(), "DragOver");
            }
            if (this.node().contains(e.target)) this.lastChildEnter = (new Date().getTime());

        } catch (e) {
            console.error(e);
        }
    });

    this.bind("dragleave", function (e) {
        try {
            if (this.lastChildEnter) {
                var delta = (new Date().getTime()) - this.lastChildEnter;
                if (delta < 50) return;
            }
            Dom.removeClass(this.node(), "DragOver");
        } catch (e) {
            console.error(e);
        }
    });

    this.bind("click", function () {
        this.fileInput.click();
    }, this.messagePane);

    this.bind("click", function () {
        this.fileInput.click();
    }, this.addMoreButton);

    this.bind("change", function () {
        var files = this.fileInput.files;
        if (!files) return;
        var added = false;
        for (var i = 0; i < files.length; i ++) {
            var ok = this.addFile(files[i]);
            if (ok) {
                added = true;
            }
        }
        if (added) {
            this.invalidateStatus();
            this.fireFileModified();
        }
    }, this.fileInput);

    this.bind("click", function (event) {
        var isDelete = Dom.findUpwardForData(event.target, "_isDeleteIcon");
        if (!isDelete) return;
        var wrapper = Dom.findUpwardForNodeWithData(event.target, "_fileInfo");
        if (!wrapper) return;
        Dialog.confirm("Are you sure you want to remove this item?", "", "Remove", function () {
            wrapper.parentNode.removeChild(wrapper);
            this.rebuildFileInfoList();
            this.invalidateStatus();
            this.fireFileModified();
        }.bind(this), "Cancel");
    }.bind(this), this.PreviewWrapper);


    this.setupReordering();

    this.fileInfoList = [];
    this.invalidateStatus();

}
__extend(BaseTemplatedWidget, FileUploadView);

FileUploadView.MIME_FILE_INFO = "text/plain";
FileUploadView.UUID_PREFIX = "fileinfo:";
FileUploadView.MIME_MAP = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif"
};
FileUploadView.MIME_REVERSED_MAP = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif"
};

FileUploadView.prototype.setContentFragment = function (fragment) {
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node || node.nodeType != Node.ELEMENT_NODE) continue;

        var role = node.getAttribute("role") || node.localName;
        if (role == "empty-message") {
            this.messagePane.innerHTML = "";
            this.messagePane.appendChild(node);
        } else if (role == "add-more-button-text") {
            this.addMoreText.innerHTML = "";
            this.addMoreText.appendChild(node);
        } else if (role == "add-more-message") {
            this.addMoreMessageText.innerHTML = "";
            this.addMoreMessageText.appendChild(node);
        } else if (role == "limit-reached-message") {
            this.limitReachedMessageText.innerHTML = "";
            this.limitReachedMessageText.appendChild(node);
        } else if (role == "previewer") {
            this.setupPreviewer(node);
        }
    }
};
FileUploadView.prototype.setupPreviewer = function (element) {
    var val = element.getAttribute("name");
    if (val && val.length > 0) this.previewerConfig.name = window[val];

    for (var i = 0; i < element.childNodes.length; i ++) {
        var node = element.childNodes[i];
        if (!node || node.nodeType != Node.ELEMENT_NODE) continue;

        var role = node.getAttribute("role") || node.localName;
        if (role == "img") {
            val = node.getAttribute("centerCrop");
            if (val == "false") this.previewerConfig.image.centerCrop = false;
            val = node.getAttribute("notUpscale");
            if (val == "false") this.previewerConfig.image.notUpscale = false;
        }
    }
};
FileUploadView.prototype.setupReordering = function () {
    if (this.maxFiles <= 1) return;

    var baseFunction = DragAndDropManager.DROP_AT_CONTAINER("horizontal");
    var dropTargetFinderFunction = function (event, manager) {
        var target = baseFunction(event, manager);
        if (target.mode == DragAndDropManager.DROP_APPEND) {
            target.mode = DragAndDropManager.DROP_PREV_SIBLING;
            target.element = this.addMoreButton;
        }

        return target;
    }.bind(this);
    this.dnd = new DragAndDropManager()
                .source(this.previewContainer)
                .anchor(function (node) {
                    if (Dom.findUpwardForData(node, "_isDeleteIcon")) throw "Stop dragging when clicking on delete";

                    return node._fileInfo && Dom.hasClass(node, "PreviewWrapper");
                })
                .itemInfo(function (previewAnchor) {
                    return {
                        element: previewAnchor,
                        data: previewAnchor._fileInfo
                    };
                })
                .destination(this.previewContainer)
                .canDrop(function (data) {
                    return this.isFileInfoAccepted(data);
                }.bind(this))
                .dropAt(dropTargetFinderFunction)
                .setup();

    this.dnd.createDragImageNode = function () {
        var node = Dom.newDOMElement({
            _name: "div",
            "class": "FileUploadViewDragImage"
        });

        node.style.width = Dom.getOffsetWidth(DragAndDropManager.draggable) + "px";
        node.style.height = Dom.getOffsetHeight(DragAndDropManager.draggable) + "px";
        node.style.backgroundColor = "rgba(0, 0, 0, 0.3)";

        return node;
    };
    this.dnd.createDropHintNode = function () {
        return Dom.newDOMElement({
            _name: "div",
            "class": "DropHint"
        });
    };
    this.dnd.onDrop = function (draggable, draggedData, target) {
        if (!draggable || !target) return;
        if (target.mode == DragAndDropManager.DROP_APPEND) {
            if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
            target.element.appendChild(draggable);
        } else if (target.mode == DragAndDropManager.DROP_PREV_SIBLING) {
            if (target.element != draggable) {
                var container = target.element.parentNode;
                if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
                container.insertBefore(draggable, target.element);
            }
        }

        this.rebuildFileInfoList();
    }.bind(this);
};
FileUploadView.prototype.rebuildFileInfoList = function () {
    this.fileInfoList = [];
    for (var i = 0; i < this.previewContainer.childNodes.length; i ++) {
        var child = this.previewContainer.childNodes[i];
        if (child._fileInfo) this.fileInfoList.push(child._fileInfo);
    }
};
FileUploadView.prototype.getPreviewerList = function () {
    var previewerList = [];
    for (var i = 0; i < this.previewContainer.childNodes.length; i ++) {
        var child = this.previewContainer.childNodes[i];
        if (child._fileInfo && child._previewer) previewerList.push(child._previewer);
    }
    
    return previewerList;
};
FileUploadView.prototype.getFirstImageSize = function () {
    var previewer = this.getPreviewerList()[0];
    if (!previewer) return null;
    
    if (!previewer.getImageSize) throw "Previewer does not support getImageSize()";
    return previewer.getImageSize();
};

FileUploadView.prototype.getCommaSeparatedStoragePaths = function () {
    var paths = [];
    for (var i = 0; i < this.fileInfoList.length; i ++) {
        var fileInfo = this.fileInfoList[i];
        if (fileInfo.storageLocation) paths.push(fileInfo.storageLocation);
    }

    return paths.join(",");
};
FileUploadView.prototype.setCommaSeparatedStoragePaths = function (paths) {
    var pathList = paths ? paths.split(",") : [];
    this.fileInfoList = [];
    while (this.previewContainer.firstChild && this.previewContainer.firstChild != this.addMoreButton) {
        this.previewContainer.removeChild(this.previewContainer.firstChild);
    }
    for (var i = 0; i < pathList.length; i ++) {
        var path = pathList[i];

        if (!path.match(/^.*\/([^\/]+\.([a-z0-9]+))$/)) continue;
        var mime = FileUploadView.MIME_MAP[RegExp.$2] || "image/unknown";

        var fileInfo = {
            file: null,
            contentType: mime,
            size: 1,
            name: RegExp.$1,
            url: path,
            id: null,
            storageLocation: path,
            uuid: FileUploadView.UUID_PREFIX + Util.newUUID()
        };
        if (!this.isFileInfoAccepted(fileInfo)) continue;
        this.addFileInfo(fileInfo);
    }

    this.invalidateStatus();
};
FileUploadView.prototype.onAttached = function () {
    if (!FileUploadView._preventDefaultInstalled) {
        document.body.addEventListener("dragover", function (event) {
            event.preventDefault();
        }, false);
        document.body.addEventListener("drop", function (event) {
            event.preventDefault();
        }, false);

        FileUploadView._preventDefaultInstalled = true;
    }
};

FileUploadView.prototype.findFileInfo = function (uuid) {
    for (var i = 0; i < this.fileInfoList.length; i ++) {
        var fileInfo = this.fileInfoList[i];
        if (fileInfo.uuid == uuid) return fileInfo;
    }

    return null;
};
FileUploadView.prototype.handleDrop = function (event) {
    try {
        this.handleDropImpl(event);
    } catch (e) {
        console.error(e);
    }
};
FileUploadView.prototype.handleDropImpl = function (event) {
    Dom.removeClass(this.node(), "DragOver");
    event.preventDefault();
    var files = null;

    if (event.dataTransfer.items) {
        files = [];
        for (var i = 0; i < event.dataTransfer.items.length; i ++) {
            if (event.dataTransfer.items[i].kind == "file") {
                files.push(event.dataTransfer.items[i].getAsFile());
            }
        }
    } else if (event.dataTransfer.files) {
        files = event.dataTransfer.files;
    }

    if (!files) return;
    var added = false;
    for (var i = 0; i < files.length; i ++) {
        var ok = this.addFile(files[i]);
        if (ok) {
            added = true;
        }
    }
    if (added) {
        this.fireFileModified();
        this.invalidateStatus();
    }
};
FileUploadView.prototype.invalidateStatus = function () {
    Dom.toggleClass(this.node(), "HasFiles", this.fileInfoList.length > 0);
    Dom.toggleClass(this.node(), "LimitReached", this.fileInfoList.length >= this.maxFiles);
};
FileUploadView.prototype.isFileDragging = function (event) {
    var dt = event.dataTransfer;
    if (!dt) return false;

    if (dt.files) {
        if (dt.files.length > 0) return true;
    }

    if (dt.items) {
        if (dt.items.length > 0 && dt.items[0].kind == "file") return true;
    }

    return false;
}
FileUploadView.prototype.handleDragOver = function (event) {
    try {
        if (this.isFileDragging(event) && this.fileInfoList.length < this.maxFiles) {
            Dom.addClass(this.node(), "DragOver");
        }
    } catch (e) {
        console.error(e);
    }
};
FileUploadView.prototype.handleDragEnd = function (event) {
};
FileUploadView.prototype.isFileInfoAccepted = function (fileInfo) {
    if (!fileInfo.name.match(/.*\.([a-z0-9]+)$/i)) return false;
    var ext = ("" + RegExp.$1).toLowerCase();
    if (this.acceptedExtensions.indexOf(ext) < 0) return false;

    return true;
};
FileUploadView.prototype.addFile = function (file, dataURL) {
    if (this.fileInfoList.length >= this.maxFiles) return false;

    var fileInfo = {
        file: file,
        contentType: file.type,
        size: file.size,
        name: file.name,
        url: dataURL ? dataURL : null,
        id: null,
        uuid: FileUploadView.UUID_PREFIX + Util.newUUID()
    };
    if (!this.isFileInfoAccepted(fileInfo)) {
        Dialog.error("Only " +  this.acceptedExtensions.join(", ").toUpperCase() + " are allowed.");
        return false;
    }
    this.addFileInfo(fileInfo);
    return true;
};
FileUploadView.prototype.addFileInfo = function (fileInfo) {
    var views = {};
    var wrapper = Dom.newDOMElement({
        _name: "hbox",
        "class": "PreviewWrapper",
        draggable: true,
        _children: [
            {_name: "hbox", _id: "_previewerHolder", flex: "1", "class": "Holder", draggable: true},
            {
                _name: "vbox", _id: "_progressPane", "class": "ProgressPane",
                _children: [
                    {_name: "span", _id: "_progressDisplay", "class": "ProgressDisplay"},
                    {
                        _name: "hbox", _id: "_progressTotal",
                        "class": "ProgressTotal",
                        _children: [
                            {_name: "div", _id: "_progressUploaded", "class": "ProgressUploaded"}
                        ]
                    },
                ]
            },
            {_name: "icon", _id: "_deleteIcon", "class": "close-circle"}
        ]
    }, document, views);
    wrapper._views = views;
    views._deleteIcon._isDeleteIcon = true;

    this.previewContainer.insertBefore(wrapper, this.addMoreButton);

    if (fileInfo.centerCrop === void 0) {
        fileInfo.centerCrop = this.previewerConfig.image.centerCrop;
    }
    if (fileInfo.notUpscale === void 0) {
        fileInfo.notUpscale = this.previewerConfig.image.notUpscale;
    }

    var clazz = this.previewerConfig.name;
    var previewer = new clazz().into(wrapper._views._previewerHolder);
    previewer.setFileInfo(fileInfo);
    wrapper._fileInfo = fileInfo;
    wrapper._previewer = previewer;


    this.fileInfoList.push(fileInfo);
    var thiz = this;

    if (fileInfo.file) {
        Dom.setInnerText(wrapper._views._progressDisplay, "Waiting...");
        wrapper._views._progressUploaded.style.width = "0%";

        Dom.addClass(wrapper, "Uploading");
        var callback = function (result) {
            Dom.removeClass(wrapper, "Uploading");
            fileInfo.storageLocation = result.storageLocation;
            fileInfo._resource = result;
            //TODO: mark fileInfo as uploaded
            thiz.fireFileModified();
        };
        callback._uploadProgressed = function (uploaded, total) {
            var percent = Math.round(100 * uploaded / total) + "%";
            Dom.setInnerText(wrapper._views._progressDisplay, percent);
            wrapper._views._progressUploaded.style.width = percent;
        };

        $teamResourceManager.uploadResource(fileInfo.file, {
            dataUUID: this.dataUUID,
            dataType: this.dataType || "sample",
            description: this.dataDescription || "Description of the resource",
            title: fileInfo.name
        }, callback);
    }

    return previewer;
};

FileUploadView.FILE_CHANGE_EVENT_NAME = "p:FileModified";
FileUploadView.prototype.fireFileModified = function () {
    Dom.emitEvent(FileUploadView.FILE_CHANGE_EVENT_NAME, this.node());
};
