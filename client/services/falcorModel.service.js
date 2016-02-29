module.exports = angular.module("falcorception.falcorModel", [
  require("./falcorFactory.service").name,
]).service("falcorModel", function (falcorFactory) {
  return falcorFactory("/falcorception.json")
})
