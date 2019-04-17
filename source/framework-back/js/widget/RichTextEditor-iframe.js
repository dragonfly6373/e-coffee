var initialized = false;
var editor = null;
window.onload = function () {
    if (initialized) return;

    var instanceName = window.location.hash.substring(1);
    var re = window.parent[instanceName];

    var editorContainer = document.getElementById("editorContainer");
    var wrapper = document.getElementById("wrapper");
    var toolbar = document.getElementById("toolbar");
    var pendingContent = re.pendingContent || "";

    editor = new Quill(editorContainer, {
        theme: "snow",
        modules: {
            toolbar: toolbar,
            clipboard: {
                matchVisual: false
            }
        }
    });

    editor.setHtmlContent = function (html) {
        editor.clipboard.dangerouslyPasteHTML(html);
    };
    editor.getHtmlContent = function () {
        return editor.root.innerHTML;
    };

    editorContainer.addEventListener("input", function () {
        re.onSizeChanged(editor);
    }, false);
    editorContainer.addEventListener("keyup", function () {
        re.onSizeChanged(editor);
    }, false);

    editor.setHtmlContent(pendingContent);
    editor.getEditorSize = function () {
        return {
            width: document.body.scrollWidth,
            height: wrapper.scrollHeight + 5
        };
    };
    editor.shiftToolbar = function (dy) {
        toolbar.style.top = dy + "px";
    };
    editor.getSelectionBoundingRect = function (dy) {
        try {
            var selection = window.getSelection();
            var range = selection.getRangeAt(0);
            if (range.getClientRects().length > 0) {
                return range.getBoundingClientRect();
            } else {
                return range.startContainer.getBoundingClientRect();
            }
        } catch (e) {
            return null;
        }
    };
    editor.getToolbar = function () {
        return toolbar;
    };

    re.onIframeInitialized(editor);

    initialized = true;
}
