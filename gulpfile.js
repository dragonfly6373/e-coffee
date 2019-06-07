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

const fs = require('fs');
const path = require('path');
const es = require('event-stream');
const spawn = require('child_process');

const DIST_PATH = 'dist/electron-app';

function formatString(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

function component(cb) {
    function listDir(dir) {
        return fs.readdirSync(dir)
        .filter(function(file){
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
    }
    var SRC_PATH = 'source/component';
    var dirs = listDir(SRC_PATH);
    var counter = 0;
    function onDone() {
        counter ++;
        if (counter == dirs.length) {
            cb();
        }
    }
    var template_pack = function(folder) {
        return src(path.join(SRC_PATH, folder, '*.xhtml'))
            .pipe(flatten())
            .pipe(dest(path.join(DIST_PATH, SRC_PATH, folder)));
    }
    var js_pack = dirs.map(function(folder) {
        console.log("Pack:", folder);
        return src(path.join(SRC_PATH, folder, '*.js'))
                    .pipe(concat(folder + '.pack.js'))
                    .pipe(uglify())
                    .pipe(dest(path.join(DIST_PATH, SRC_PATH, folder)))
                    .pipe(src(path.join(SRC_PATH, folder, '*.xhtml')))
                    .pipe(dest(path.join(DIST_PATH, SRC_PATH, folder)))
                    .on('end', onDone);
    });
    var app_pack = function() {
        return src([path.join(SOURCE_PATH, '*.js'), path.join(SOURCE_PATH, '*.xhtml')])
            .pipe(dest(path.join(DIST_PATH, SRC_PATH)));
    }
    return es.concat.apply(null, js_pack);
}
exports.component = component;

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

exports.static = function() {
    return src('static/**/*')
        .pipe(dest('dist/electron-app/static'));
}

exports.clean = function() {
    return src('dist/electron-app/source/', {read: false})
        .pipe(clean({force: true}));
}
exports.framework = parallel(framework, styles);
exports.all = series(clean, parallel(framework, sqlite, component));
