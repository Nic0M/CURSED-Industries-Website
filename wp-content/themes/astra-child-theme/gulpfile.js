const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const concat = require('gulp-concat'); 
const closureCompiler = require('google-closure-compiler').gulp();

// Task to compile Sass
gulp.task('sass', function() {
    return gulp.src('assets/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('assets/css/unminified'));
});

// Task to minify CSS
gulp.task('minify-css', function() {
    return gulp.src('assets/css/unminified/*.css')
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(concat('main.min.css')) // Add this line to concatenate all minified CSS files into one file
        .pipe(gulp.dest('assets/css/minified'));
});

// Task to compile and minify JS
gulp.task('compile-js', () =>
  gulp.src('assets/js/unminified/**/*.js') // Adjust the source path as needed
    .pipe(closureCompiler({
      compilation_level: 'SIMPLE_OPTIMIZATIONS', // Or SIMPLE_OPTIMIZATIONS
      warning_level: 'VERBOSE',
      language_in: 'ECMASCRIPT_2020',
      language_out: 'ECMASCRIPT_2015',
      externs: ['assets/js/externs/leaflet-externs.js'],
      js_output_file: 'main.min.js' // Specify your output file name
    }))
    .pipe(gulp.dest('assets/js/minified/')) // Adjust the destination path as needed
);

// Default task
gulp.task('default', gulp.series('sass', 'minify-css', 'compile-js'));
