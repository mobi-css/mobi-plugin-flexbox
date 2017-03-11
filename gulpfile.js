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
const http = require('http');
const ecstatic = require('ecstatic');
const runSequence = require('run-sequence');
const Pagic = require('pagic');
const debounce = require('debounce');
const pkg = require('./package.json');

const DEBOUNCE_DELAY = 300;

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

const SRC_DIR = path.resolve(__dirname, 'src');
const DIST_DIR = path.resolve(__dirname, 'dist');
const SITE_DIR = path.resolve(__dirname, 'site');
const SITE_CSS_DIR = path.resolve(__dirname, 'site/css');
const PUBLIC_DIR = path.resolve(__dirname, 'docs');

gulp.task('default', () => {
  runSequence('build', 'site:build_css', 'pagic', 'public:serve', () => {
    gulp.watch([
      `${SRC_DIR}/**/*`,
    ], debounce(() => {
      runSequence('build', 'site:build_css');
    }, DEBOUNCE_DELAY));
    gulp.watch([
      `${SITE_DIR}/**/*`,
    ], debounce(() => {
      runSequence('pagic');
    }, DEBOUNCE_DELAY));
  });
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

gulp.task('site:build_css', ['site:clean_css', 'site:copy_css']);

gulp.task('site:clean_css', () => {
  rimraf.sync(`${SITE_CSS_DIR}/*`);
});

gulp.task('site:copy_css', () => gulp.src(`${DIST_DIR}/**/*`)
  .pipe(gulp.dest(SITE_CSS_DIR)));

gulp.task('pagic', () => {
  const pagic = new Pagic();
  pagic.build();
});

gulp.task('public:serve', () => {
  http.createServer(
    ecstatic({ root: PUBLIC_DIR })
  ).listen(8000);

  console.log(`ecstatic serving ${PUBLIC_DIR} at http://0.0.0.0:8000`);
});
