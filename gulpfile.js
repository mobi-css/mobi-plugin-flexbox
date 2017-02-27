const gulp = require('gulp');
const path = require('path');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const rimraf = require('rimraf');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCSS = require('gulp-clean-css');
const insert = require('gulp-insert');
const pkg = require('./package.json');
const tap = require('gulp-tap');
const http = require('http');
const ecstatic = require('ecstatic');
const runSequence = require('run-sequence');
const md = require('markdown-it')({
  html: true,
}).use(require('markdown-it-anchor'));
const gutil = require('gulp-util');

const postcssConfig = [autoprefixer({ browsers: [
  'last 5 iOS versions',
  'last 5 Android versions',
  'last 5 ExplorerMobile versions',
  'last 5 ChromeAndroid versions',
  'last 5 UCAndroid versions',
  'last 5 FirefoxAndroid versions',
  'last 5 OperaMobile versions',
  'last 5 OperaMini versions',
  'last 5 Samsung versions',

  'last 3 Chrome versions',
  'last 3 Firefox versions',
  'last 3 Safari versions',
  'last 3 Edge versions',
] })];

const PKG_NAME = pkg.name;

const SRC_DIR = path.resolve(__dirname, 'src');
const DIST_DIR = path.resolve(__dirname, 'dist');
const PUBLIC_DIR = path.resolve(__dirname, 'docs');
const PUBLIC_CSS_DIR = path.resolve(__dirname, 'docs/assets/css');

gulp.task('default', () => {
  runSequence('build', 'public:build_css', 'public:build_html', 'public:serve');
  gulp.watch([
    `${SRC_DIR}/**/*`,
  ], () => {
    runSequence('build', 'public:build_css');
  });
  gulp.watch([
    `${PUBLIC_DIR}/**/*`,
    `!${PUBLIC_DIR}/**/*.html`,
  ], ['public:build_html']);
});

gulp.task('build', (callback) => {
  runSequence('clean:dist', 'build:css', 'build:css:min', callback);
});

gulp.task('clean:dist', () => {
  rimraf.sync(`${DIST_DIR}/*`);
});

gulp.task('build:css:min', () => gulp.src(`${DIST_DIR}/${pkg.name}.css`)
  .pipe(sourcemaps.init())
  .pipe(cleanCSS())
  .pipe(insert.prepend(`/* ${pkg.name} v${pkg.version} ${pkg.homepage} */\n`))
  .pipe(rename(`${pkg.name}.min.css`))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(DIST_DIR)));

gulp.task('build:css', () => gulp.src(`${SRC_DIR}/${pkg.name}.scss`)
  .pipe(sourcemaps.init())
  .pipe(sass({
    includePaths: 'node_modules',
  }).on('error', sass.logError))
  .pipe(postcss(postcssConfig))
  .pipe(insert.prepend(`/* ${pkg.name} v${pkg.version} ${pkg.homepage} */\n`))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(DIST_DIR)));

gulp.task('public:build_css', ['public:clean_css', 'public:copy_css']);

gulp.task('public:clean_css', () => {
  rimraf.sync(`${PUBLIC_CSS_DIR}/*`);
});

gulp.task('public:copy_css', () => gulp.src(`${DIST_DIR}/**/*`)
  .pipe(gulp.dest(PUBLIC_CSS_DIR)));

gulp.task('public:build_html', () => gulp.src(`${PUBLIC_DIR}/**/*.md`)
  .pipe(tap(file => {
    /* eslint no-param-reassign:0 */
    const relativeToPublicCSSDir = path.relative(
      path.resolve(file.path, '..'),
      path.resolve(PUBLIC_CSS_DIR)
    );
    const cssPath = path.join(relativeToPublicCSSDir, `${pkg.name}.min.css`);
    file.contents = new Buffer(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="x-ua-compatible" content="ie=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0,
            maximum-scale=1.0, user-scalable=no"/>
          
          <title>${pkg.name}</title>

          <link rel="stylesheet" href="https://unpkg.com/mobi.css@2.0.0-alpha.1/dist/mobi.min.css" />
          <link rel="stylesheet" href="${cssPath}" />
        </head>
        <body>
          ${md.render(file.contents.toString())}
        </body>
      </html>
    `);
    file.path = gutil.replaceExtension(file.path, '.html');
  }))
  .pipe(gulp.dest(PUBLIC_DIR)));

gulp.task('public:serve', () => {
  http.createServer(
    ecstatic({ root: PUBLIC_DIR })
  ).listen(8000);

  console.log(`ecstatic serving ${PUBLIC_DIR} at http://0.0.0.0:8000`);
});
