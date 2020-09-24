const reporter = require('multiple-cucumber-html-reporter')
const open = require('open')
const fs = require('fs')
const path = require('path')

const createFolder = async (fileName) => {
  await fs.mkdir(path.join(__dirname, ...fileName), (err) => {
    if (err) {
      return false
    }
  })
}
const name = require('./package').config.report
if (!name) {
  throw new Error('cant read report config name')
}

let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/:/g, '-')
createFolder(['html', name])
createFolder(['html', name, `${name}-${date}`])
fs.createReadStream(path.join(__dirname, 'json', 'report.json')).pipe(fs.createWriteStream(path.join(__dirname, 'html', name, `${name}-${date}`, 'report.json')))
reporter.generate({
  jsonDir: 'json',
  reportPath: `html/${name}/${name}-${date}`,
  disableLog: true,
  displayDuration: true,
  reportSuiteAsScenarios: true,
  launchReport: true,
  hideMetadata: true,
  pageTitle: `Test Reports - ${name} Du ${date}`,
  reportName: name,
  pageFooter: '<div class="created-by"><p>NeoXam</p></div>'
})
open(`http://127.0.0.1:8080/html/${name}/${name}-${date}`, { wait: true })
