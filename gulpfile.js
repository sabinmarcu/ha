'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync'),
    sourcemaps = require('gulp-sourcemaps'),
    bower = require('gulp-bower'),
    babel = require('gulp-babel');

// Load plugins
var $ = require('gulp-load-plugins')({
    rename: {
            'gulp-ruby-sass': 'sass'
        }
    });


gulp.task('scss', function(){
    var browsers = [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'Opera 12.1'
    ];

    return gulp.src(['src/**/*.scss'])
        .pipe($.sass({
            style: 'expanded'
        })
        .on('error', $.util.log))
        .pipe($.postcss([
            require('autoprefixer-core')({
                browsers: browsers
            })
        ]))
        .pipe(gulp.dest('build'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('less', function() {
    var browsers = [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'Opera 12.1'
    ];

    return gulp.src('src/**/*.less')
        .pipe($.less({
            paths: ['bower_components']
        })
        .on('error', $.util.log))
        .pipe($.postcss([
                require('autoprefixer-core')({
                    browsers: browsers
                })
            ]))
        .pipe(gulp.dest('build'))
        .pipe(browserSync.reload({stream: true}));
    })

gulp.task('styles', ['scss', 'less']);


gulp.task('views', function(){
    return gulp.src([
            '!src/views/layout.jade',
            'src/views/*.jade'
        ])
        .pipe($.jade({
            pretty: true
        }))
        .on('error', $.util.log)
        .pipe(gulp.dest('build'))
        .pipe(browserSync.reload({stream: true}));
});


gulp.task('images', function() {
    return gulp.src('src/images/**/*')
        .pipe($.imagemin({
            svgoPlugins: [{
                convertPathData: false
            }]
        }))
        .pipe(gulp.dest('build/images'));
});

gulp.task('bower', function() {
    return bower('bower_components')
        .pipe(gulp.dest('build/js'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', function() {
    return gulp.src(['node_modules/babel-polyfill/dist/polyfill.js', 'src/js/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015', 'stage-0']
            // plugins: ['transform-runtime']
        }))
        .pipe(concat('scripts.js'))
        .pipe(sourcemaps.write('.'))
        .on('error', $.util.log)
        .pipe(gulp.dest('build/js'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('js', ['bower', 'scripts']);


gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './build'
        }
    });
});


gulp.task('watch', ['build'], function() {
    gulp.watch('src/**/*.less', ['styles']);
    gulp.watch('src/images/**/*', ['images']);
    gulp.watch('src/**/*.jade', ['views']);
    gulp.watch('src/**/*.js', ['scripts']);

    gulp.start('browser-sync');
});

// JSHint grunfile.js
gulp.task('selfcheck', function() {
    return gulp.src('gulpfile.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'))
        .pipe($.jshint.reporter('fail'));
});


gulp.task('clean', function(cb) {
    var del = require('del');
    del(['build'], cb);
});


gulp.task('build', ['styles', 'views', 'images', 'js']);


gulp.task('default', ['clean'], function() {
    gulp.start('watch');
});
