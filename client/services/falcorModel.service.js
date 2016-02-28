const HttpDataSource = require("falcor-http-datasource")

module.exports = angular.module("falcorception.falcorModel", []).service("falcorModel", function (falcorFactory) {
  return falcorFactory("/falcorception.json")
})
