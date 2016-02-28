const HttpDataSource = require("falcor-http-datasource")

module.exports = angular.module("falcorception.falcorFactory", []).service("falcorFactory", function (falcor) {
  return url => new falcor.Model({source: new HttpDataSource(url) }).batch()
})
