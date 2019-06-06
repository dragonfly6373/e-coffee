const {src, dest, parallel, series, task} = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');
const flatten = require('gulp-flatten');
const wrap = require('gulp-wrap-file');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
//const uglify = require('gulp-uglify');

function formatString(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

function getModule(path) {
    var reg = new RegExp("^.*/([^/]+)/[^/]+$");
    var result = reg.match(path);
}

function framework() {
    return src('source/framework/**/*.js')
        .pipe(concat('common-framework.pack.js'))
        .pipe(dest('dist/electron-app/source/framework'));
}

function styles() {
    return src('source/framework/widget/style/**/*')
        .pipe(dest('dist/electron-app/source/framework'));
}

function sqlite() {
    return src('source/data/sqlite/model/*.js')
        .pipe(wrap({
            wrapper: function(content, file) {
                return formatString('{0}\nModel.{1} = {1};\n', content, file.modName.replace(/^.*[\\\/]/, ''));
            }
        }))
        .pipe(concat('sqlite-db.pack.js'))
        .pipe(wrap({wrapper: 'var DataType = { BOOLEAN: 1, INTEGER: 2, TEXT: 3, BIGINT: 4, DOUBLE: 5, FLOAT: 6, BLOB: 7, TIMESTAMP: 8 };\nvar Model = {};\n{file}'}))
        .pipe(uglify())
        .pipe(dest('dist/electron-app/source/data'));
}
exports.sqlite = sqlite;

var cms = parallel(() => {
        return src('source/views/cms/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('cms.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }, () => {
        return src('source/views/cms/**/*.xhtml')
            .pipe(flatten())
            .pipe(dest('dist/electron-app/source/widget'));
    }
);
// exports.cms = cms;

var common = parallel(() => {
        return src('source/views/common/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('common.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }, () => {
        return src('source/views/common/**/*.xhtml')
            .pipe(flatten())
            .pipe(dest('dist/electron-app/source/widget'));
    }
);
// exports.common = common;

var component = parallel(() => {
        return src('source/views/components/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('component.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }, () => {
        return src('source/views/components/**/*.xhtml')
            .pipe(flatten())
            .pipe(dest('dist/electron-app/source/widget'));
    }
);
// exports.component = component;

exports.static = function() {
    return src('static/**/*')
        .pipe(dest('dist/electron-app/static'));
}

exports.clean = function() {
    return src('dist/electron-app/source/', {read: false})
        .pipe(clean({force: true}));
}
exports.framework = parallel(framework, styles);
exports.all = parallel(sqlite, common, cms, component);
