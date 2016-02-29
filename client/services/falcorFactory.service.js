const HttpDataSource = require("falcor-http-datasource")

module.exports = angular.module("falcorception.falcorFactory", [
  require("./falcor.service").name,
]).service("falcorFactory", function (falcor) {
  return url => new falcor.Model({source: new HttpDataSource(url) }).batch()
})
