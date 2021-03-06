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
const {spawn} = require('child_process');

const DIST_PATH = 'dist/electron-app';

function formatString(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

function widget_pack(cb) {
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
    var js_pack = dirs.map(function(folder) {
        console.log("Pack:", folder);
        return src(path.join(SRC_PATH, folder, '*.js'))
                    .pipe(wrap({wrapper: function(content, file) {
                        var file_name = file.modName.replace(/^.*[\\\/]/, '');
                        if (folder != 'common') return formatString('{0}\n_pkg.{2}.{1} = {1};', content, file_name, folder);
                        else return content;
                    }}))
                    .pipe(concat(folder + '.pack.js'))
                    .pipe(wrap({wrapper: function(content, file) {
                        if (folder != 'common') return ('_pkg.' + folder + ' = {};\n' + content);
                        else return content;
                    }}))
                    // .pipe(uglify())
                    .pipe(dest(path.join(DIST_PATH, SRC_PATH, folder)))
                    .pipe(src(path.join(SRC_PATH, folder, '*.xhtml')))
                    .pipe(dest(path.join(DIST_PATH, SRC_PATH, folder)))
                    .on('end', onDone);
    });
    return es.concat.apply(null, js_pack);
}
function main_pack() {
    var SRC_PATH = 'source/component';
    return src([path.join(SRC_PATH, '*.js'), path.join(SRC_PATH, '*.xhtml')])
    .pipe(dest(path.join(DIST_PATH, SRC_PATH)));
}
var component = parallel(main_pack, widget_pack);
exports.component = component;

function _widget() {
    return src(['source/framework/widget/Common.js', 'source/framework/widget/Utils.js', 'source/framework/widget/*.js'])
        .pipe(concat('widget.pack.js'))
        .pipe(src('source/framework/widget/*.xhtml'))
        .pipe(dest(path.join(DIST_PATH, 'source/framework/widget')));
}
function _framework() {
    return src('source/framework/*.js')
        .pipe(dest(path.join(DIST_PATH, 'source/framework')));
}
function _style() {
    return src('source/framework/style/**/*')
        .pipe(dest(path.join(DIST_PATH, 'source/framework/style')));
}
exports.framework = parallel(_widget, _framework, _style);

function _model() {
    return src('source/data/sqlite/model/*.js')
        .pipe(wrap({
            wrapper: function(content, file) {
                return formatString('{0}\nModel.{1} = {1};\n', content, file.modName.replace(/^.*[\\\/]/, ''));
            }
        }))
        .pipe(concat('model.pack.js'))
        .pipe(wrap({wrapper: 'var Model = {};\n{file}'}))
        .pipe(dest(path.join(DIST_PATH, 'source/data')));
}
exports.model = _model;
function _sqlite() {
    return src('source/data/sqlite/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('sqlite-db.pack.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest(path.join(DIST_PATH, 'source/data')));
}
exports.sqlite = parallel(_sqlite, _model);

function service() {
    return src('source/service/*.js')
        .pipe(concat('service.pack.js'))
        .pipe(dest('dist/electron-app/source/service'));
}
exports.service = service;

function clear() {
    return src('dist/electron-app/source/*', {read: false})
        .pipe(clean({force: true}));
}
exports.clean = clear;

exports.static = function() {
    return src('static/**/*')
        .pipe(dest('dist/electron-app/static'));
}
exports.all = series(clear, parallel(_framework, _widget, _style, _model, _sqlite, component, service));


exports.ls = function(cb) {
    const ls = spawn('ls', ['./source/'])
        .on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            cb();
        });
    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    ls.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
};
