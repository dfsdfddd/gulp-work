var gulp = require('gulp');
var rev = require('gulp-rev'); // 创建版本号（hash）值
var revCollector = require('gulp-rev-collector'); // 将版本号添加到文件后
var sequence = require('run-sequence'); // 让gulp任务同步运行
var clean = require('gulp-clean'); // 清除dist构建目录
var htmlmin = require('gulp-htmlmin'); // 压缩html
var cssnano = require('gulp-cssnano'); // css压缩
var autoprefixer = require('gulp-autoprefixer'); // 自动处理css兼容后缀
var babel = require('gulp-babel'); // es6转es5
var concat = require('gulp-concat'); // 文件合并
var uglify = require('gulp-uglify'); // js混淆
var imagemin = require('gulp-imagemin'); // 图片压缩
var browserSync = require('browser-sync').create(); // 启动本地服务，修改免F5刷新
var useref = require('gulp-useref'); // 替换HTML中资源的引用路径
var less = require("gulp-less"); // 添加less编译
var amdOptimize = require('amd-optimize'); //处理requirejs模块

// 路径配置
var path = {
  // 静态资源输入路径
  entry: {
    html: ['./src/*.html'],
    css: ['./src/css/*.css'],
    js: ['./src/js/*.js'],
    images: ['./src/images/*'],
    lib: ['./src/lib/**/*'],
    less: ['./src/less/*.less']
  },
  // 静态资源输出路径
  output: {
    html: './dist',
    css: './dist/css',
    js: './dist/js',
    images: './dist/images',
    lib: './dist/lib',
    less: './src/css'
  },
  // manifest文件保存路径
  rev: {
    baseRev: './rev',
    css: './rev/css',
    js: './rev/js',
    images: './rev/images'
  }
};


// 0、编译less在命令行输入gulp less启动此任务
gulp.task('less', function () {
  //1.找到less文件
  return gulp.src(path.entry.less)
    //2.编译为css
    .pipe(less())
    //3.另存为css
    .pipe(gulp.dest(path.output.less))
})


// 1、统一将html中的资源替换成压缩合并后的文件名并将HTML特定标签中的文件合并
gulp.task('html', function () {
  var options = {
    removeComments: true, //清除HTML注释
    collapseWhitespace: true, //压缩HTML
    removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  };
  return gulp.src(path.entry.html)
    .pipe(useref()) // 这个会压缩并合并html特有注释的css或者js文件，并生成对应的文件夹
    .pipe(htmlmin(options))
    .pipe(gulp.dest(path.output.html))
})
// 2、删除掉上一步操作生成的css、js合并文件(useref()也会生成，避免重复)
gulp.task('del', function () {
  return gulp.src([path.output.css, path.output.js])
    .pipe(clean());
});
// 3、css合并压缩并加版本号
gulp.task('css', function () {
  return gulp.src(path.entry.css)
    .pipe(concat('all.min.css'))
    .pipe(autoprefixer())
    .pipe(cssnano())
    .pipe(rev())
    .pipe(gulp.dest(path.output.css))
    .pipe(rev.manifest())
    .pipe(gulp.dest(path.rev.css))
});
// 4、js合并压缩并加版本号
gulp.task('js', function () {
  return gulp.src(path.entry.js)
    .pipe(concat('all.min.js')) // 合并
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify()) // 混淆
    .pipe(rev())
    .pipe(gulp.dest(path.output.js))
    .pipe(rev.manifest())
    .pipe(gulp.dest(path.rev.js))
});
// 5、图片压缩并加版本号
gulp.task('img', function () {
  return gulp.src(path.entry.images)
    // .pipe(imagemin())           // 压缩图片
    .pipe(rev())
    .pipe(gulp.dest(path.output.images))
    .pipe(rev.manifest())
    .pipe(gulp.dest(path.rev.images))
});
// 6、给文件添加版本号，针对于已经替换引用路径的HTML文件，在dist目录下
gulp.task('rev', function () {
  return gulp.src([path.rev.baseRev + '/**/*.json', path.output.html + '/**/*.html', path.output.html + '/**/*.css'])
    .pipe(revCollector({
      replaceReved: true, // 一定要添加，不然只能首次能成功添加hash
      dirReplacements: {
        'css': 'css/',
        'js': 'js/',
        'images': 'images/',
        'lib': 'lib/',
      }
    }))
    .pipe(gulp.dest('dist'));
});

// 7、复制其他库到构建目录(只要保持html和库的相对路径一致，就可以不用替换路径)
gulp.task('copy', function () {
  return gulp.src(path.entry.lib)
    .pipe(gulp.dest(path.output.lib))
});

// 8、移除rev目录和dist构建目录
gulp.task('clean', function () {
  return gulp.src(['./dist', './rev'])
    .pipe(clean());
});
// 9、监控文件的改变，页面动态刷新
gulp.task('server', function() {
    browserSync.init({
      files: ['./src/css/*.css', './src/js/*.js', './src/*.html'],
      port: 3434,
      server: {
          baseDir: ['./src/'],  // 启动服务的目录 默认 index.html
          index: 'index.html'   // 自定义启动文件名
      }
    });
});


// 10、在命令行gulp auto启动此任务
gulp.task('auto', function () {
  //监听文件修改，当文件修改则执行less任务
  gulp.watch(path.entry.less, ['less']);
  // gulp4.0需要添加gulp.series
  // gulp.watch(path.entry.less, gulp.series('less'));
})

// 11、监控文件变化，自动重新构建
/*gulp.task('watch',function () {
    gulp.watch('./src/!**!/!*', ['clean','html','del','css','js','img','rev','copy']);
})*/
// 12、build
gulp.task('default', function (callback) {
  // sequence的作用是让所有任务同步执行，gulp默认的是异步执行
  sequence('clean', 'html', 'del', 'css', 'js', 'img', 'rev', 'copy', function () {
    console.log('构建完成');
  })
})

// 13、本地开发命令
gulp.task('dev', function (callback) {
  // sequence的作用是让所有任务同步执行，gulp默认的是异步执行
  sequence('server', 'auto', function () {
    console.log('dev构建完成');
  })
})


gulp.task('js2', function () {
  /**
   * amdOptimize.src 第一个参数指向 require html data-main 指向的mainjs
   * amdOptimize.src 第二个参数指向 require config  
   */
  amdOptimize.src("src/js/main", {
            paths: {
              "a":"src/js/a",
              "b":"src/js/b",
              "c":"src/js/c"
            },
            baseUrl:'./',
        })
  .pipe(concat("main.js"))//合并
  .pipe(uglify()) // 混淆
  .pipe(rev())
  .pipe(gulp.dest(path.output.js))
  .pipe(rev.manifest())
  .pipe(gulp.dest(path.rev.js))

});