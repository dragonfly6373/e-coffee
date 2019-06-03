var {src, dest, parallel, series} = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

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
    return src('source/data/sqlite/*.js')
        .pipe(concat('sqlite-db.pack.js'))
        .pipe(uglify())
        .pipe(dest('dist/electron-app/source/'));
}

function cms() {
    return src('source/views/cms/**/*.js')
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat('cms.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest('dist'));
}

function common() {
    return src('source/views/common/*.js')
        .pipe(sourcemaps.init({largeFile: true}))
        .pipe(concat('common.pack.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest('source/views/common/'));
}

exports.framework = parallel(framework, styles);
exports.sqlite = sqlite;
exports.common = common;
exports.build_all = parallel(common, cms);
