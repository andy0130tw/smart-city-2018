const fs = require('fs')
let modules = {}
let listFiles = fs.readdirSync(__dirname)

listFiles.forEach(file => {
  if (file === 'index.js') {
    return
  }

if (file.match(/\S+\.js$/)) {
    let name = file.substr(0, file.indexOf(".js"))
    modules[name] = require(`${__dirname}/${file}`)
  }
});

module.exports = modules