module.paths.push('/home/dummy/.nvm/versions/node/v8.4.0/lib/node_modules');

const fs = require('fs');

const ZIP_PATH = "/tmp/mdi-master.zip";
const URL = "https://codeload.github.com/Templarian/MaterialDesign-Webfont/zip/master";
const DIR = "/tmp/mdi-master";
const VERSION = "2.1.19";

function download() {
    var http = require('https');


    var file = fs.createWriteStream(ZIP_PATH);
    var request = http.get(URL, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(extract);
        });
    });
}

function extract() {
    var extract = require('extract-zip')
    extract(ZIP_PATH, { dir: DIR }, function (err) {
        load();
    });
};

function load() {
    var contents = fs.readFileSync(DIR + "/MaterialDesign-Webfont-master/scss/_variables.scss", 'utf8');
    var map = {};

    var includeRules = ".mdi-icon-name-to-content(@name) {\n";
    var iconRules = ("@import \"theme-default-includes.less\";\n" +
        "\n" +
        "/* MaterialDesignIcons binding for ui icons in framework widget */\n" +
        "\n" +
        "@font-face {\n" +
        "    font-family: \"Material Design Icons\";\n" +
        "    src: url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.eot?v=@VERSION\");\n" +
        "    src: url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.eot?#iefix&v=@VERSION\") format(\"embedded-opentype\"), url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.woff2?v=@VERSION\") format(\"woff2\"), url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.woff?v=@VERSION\") format(\"woff\"), url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.ttf?v=@VERSION\") format(\"truetype\"), url(\"/framework/webui/materialdesignicons/fonts/materialdesignicons-webfont.svg?v=@VERSION#materialdesigniconsregular\") format(\"svg\");\n" +
        "    font-weight: normal;\n" +
        "    font-style: normal;\n" +
        "}\n" +
        "icon {\n" +
        "    line-height: 1em;\n" +
        "}\n" +
        "icon:before,\n" +
        ".icon-set {\n" +
        "  .base-icon();\n" +
        "}\n").replace(/@VERSION/g, VERSION);
    var iconData = "";
    contents.replace(/"([^\n\r"]+)":[\s]*([A-F0-9]+)/g, function (all, name, hex) {
        includeRules += "    & when (@name = \"" + name + "\") {\n" +
                        "        content: \"\\" + hex + "\";\n" +
                        "    }\n";

        iconRules += "icon." + name + ":before {\n" +
                    "    content: \"\\" + hex + "\";\n" +
                    "}\n";

        if (iconData.length > 0) {
            iconData += ",\n";
        }
        iconData += "{name:\"" + name + "\", value:\"" + hex  + "\"}";
    });

    includeRules += "\n}";

    fs.writeFileSync(__dirname + "/theme-default-icon-includes.less", includeRules, "utf8");
    fs.writeFileSync(__dirname + "/icon-materialicons.less", iconRules, "utf8");
    fs.writeFileSync(__dirname + "/../../../../cms/admin/scripts/IconData.js", "var MATERIAL_ICONS = [\n" + iconData + "];", "utf8");

    var target = __dirname + "/../../materialdesignicons/fonts/";

    var cp = require("child_process");
    var names = [
        "materialdesignicons-webfont.eot",
        "materialdesignicons-webfont.svg",
        "materialdesignicons-webfont.ttf",
        "materialdesignicons-webfont.woff",
        "materialdesignicons-webfont.woff2"
    ];

    for (var name of names) {
        cp.execFile('/bin/cp', [DIR + "/MaterialDesign-Webfont-master/fonts/" + name, target + name]);
    }
}

download();
