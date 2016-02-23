const falcor = require("falcor")
const HttpDataSource = require("falcor-http-datasource")

module.exports = angular.module("falcorception.falcorModel", []).service("falcorModel", function (falcor) {
  return new falcor.Model({source: new HttpDataSource("/falcorception.json") }).batch()
})
