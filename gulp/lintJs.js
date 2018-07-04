var gulp = require('gulp')
var standard = require('standard')
var colors = require('colors')
var configVars = require('../configVars.js')

/**
 * Lint the JavaScript source files using standard
 */
gulp.task('lintJs', function (cb) {
  standard.lintFiles(configVars['js']['srcPath'] + configVars['js']['fileGlob'], {
    parser: 'babel-eslint',
    ignore: [configVars['js']['testFileGlob']]
  }, function (err, res) {
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      var i
      var j
      var fileResults
      var stats
      var errorCount = 0

      for (i = 0; i < res.results.length; i++) {
        fileResults = res.results[i]
        if (fileResults.errorCount || fileResults.warningCount) {
          console.info(fileResults.filePath.underline)

          for (j = 0; j < fileResults.messages.length; j++) {
            stats = fileResults.messages[j]
            if (stats.severity === 2) {
              console.error('  ' + colors.grey(stats.line + ':' + stats.column) + colors.red(' error ') + stats.message)
            } else {
              console.error('  ' + colors.grey(stats.line + ':' + stats.column) + colors.yellow(' warning ') + stats.message)
            }
            errorCount++
          }
        }
      }

      if (errorCount && process.env.CI) {
        process.exit(1)
      } else {
        cb()
      }
    }
  })
})
