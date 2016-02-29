const co = require("co")
require("angular-route") // load module

module.exports = angular.module("falcorception.app", [
  "ngRoute",
  require("../../services/falcorModel.service").name,
  require("../jumbotron/jumbotron").name,
  require("../metric/metric").name,
  require("../apiList/apiList").name,
])

.config(function ($routeProvider) {
  $routeProvider
    .when("/falcorception", {
      template: '<app napis="$resolve.napis" apis="$resolve.apis"></app>',
      resolve: {
        apis: falcorModel => falcorModel.get(
          ["apis", "length"],
          ["apis", {from: 0, length: 10}, ["id", "name"]],
          ["apis", {from: 0, length: 10}, "routes", "length"])
          .then(_.property("json.apis")),
      },
    })
    .otherwise("/falcorception")
})

.component("app", {
  templateUrl: "components/app/app.html",
  bindings: {
    napis: "=",
    apis: "=",
  },
  controller(falcorModel, $scope) {
    const ctrl = this
    ctrl.createApi = co.wrap(function* () {
      const response = yield falcorModel.call(
        "apis.create",
        ["someName"],
        [["id"], ["name"], ["url"]],
        [[{from: 0, length: 10}, ["id", "name"]], ["length"]])
      ctrl.apis = response.json.apis
      $scope.$apply()
    })
  },
})