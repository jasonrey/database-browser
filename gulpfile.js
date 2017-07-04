let gulp = require('gulp'),
    util = require('gulp-util'),
    sass = require('gulp-sass'),
    pug = require('gulp-pug'),
    mv = require('gulp-rename');

require('gulp-notifiable-task');

gulp.task('default', ['build', 'prepare']);

gulp.notifiableTask('build', ['build:css', 'build:js', 'build:html']);

gulp.notifiableTask('build:css', () => {
    return gulp.src('resources/sass/*.sass')
        .pipe(sass())
        .pipe(gulp.dest('app/css'));
});

gulp.notifiableTask('build:js', () => {
    return gulp.src('resources/js/*.js')
        .pipe(gulp.dest('app/js'));
});

gulp.notifiableTask('build:html', () => {
    return gulp.src('resources/pug/*.pug')
        .pipe(pug())
        .pipe(gulp.dest('app'));
});

gulp.task('prepare', ['prepare:bootstrap', 'prepare:vue', 'prepare:vuex']);

gulp.task('prepare:bootstrap', ['prepare:bootstrap:css', 'prepare:bootstrap:js', 'prepare:bootstrap:fonts']);

gulp.task('prepare:bootstrap:css', () => {
    return gulp.src('node_modules/bootstrap/dist/css/bootstrap' + (util.env.production ? '.min' : '') + '.css')
        .pipe(mv('bootstrap.css'))
        .pipe(gulp.dest('app/static/bootstrap/css'));
});

gulp.task('prepare:bootstrap:js', () => {
    return gulp.src('node_modules/bootstrap/dist/js/bootstrap' + (util.env.production ? '.min' : '') + '.js')
        .pipe(mv('bootstrap.js'))
        .pipe(gulp.dest('app/static/bootstrap/js'));
});

gulp.task('prepare:bootstrap:fonts', () => {
    return gulp.src('node_modules/bootstrap/dist/fonts/**')
        .pipe(gulp.dest('app/static/bootstrap/fonts'));
});

gulp.task('prepare:vue', () => {
    return gulp.src('node_modules/vue/dist/vue' + (util.env.production ? '.min' : '') + '.js')
        .pipe(mv('vue.js'))
        .pipe(gulp.dest('app/static'));
});

gulp.task('prepare:vuex', () => {
    return gulp.src('node_modules/vuex/dist/vuex' + (util.env.production ? '.min' : '') + '.js')
        .pipe(mv('vuex.js'))
        .pipe(gulp.dest('app/static'));
});

gulp.task('watch', ['watch:css', 'watch:js', 'watch:html']);

gulp.task('watch:css', () => {
    return gulp.watch('resources/sass/*.sass', ['build:css']);
});

gulp.task('watch:js', () => {
    return gulp.watch('resources/js/*.js', ['build:js']);
});

gulp.task('watch:html', () => {
    return gulp.watch('resources/pug/*.pug', ['build:html']);
});
