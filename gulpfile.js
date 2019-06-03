const {src, dest, parallel, series, task} = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

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
exports.sqlite = sqlite;

var cms = parallel(task('js', () => {
        return src('source/views/cms/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('cms.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }), task('template', () => {
        return src('source/views/cms/**/*.xhtml')
            .pipe(dest('dist/electron-app/source/widget'));
    })
);
exports.cms = cms;

var common = parallel(task('js', () => {
        return src('source/views/common/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('cms.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }), task('template', () => {
        return src('source/views/common/**/*.xhtml')
            .pipe(dest('dist/electron-app/source/widget'));
    })
);

exports.common = common;
var component = parallel(task('js', () => {
        return src('source/views/component/**/*.js')
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat('cms.pack.js'))
            .pipe(uglify())
            .pipe(sourcemaps.write())
            .pipe(dest('dist/electron-app/source/widget'));
    }), task('template', () => {
        return src('source/views/component/**/*.xhtml')
            .pipe(dest('dist/electron-app/source/widget'));
    })
);
exports.component = component;

exports.framework = parallel(framework, styles);
exports.build_all = parallel(sqlite, common, cms, component);
