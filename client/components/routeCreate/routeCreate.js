const co = require("co")

module.exports = angular.module("falcorception.routeCreate", [
  require("../../services/falcorModel.service").name,
  require("../jumbotron/jumbotron").name,
  require("../metric/metric").name,
])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:apiId/route-create", {
      template: '<route-create api="$resolve.api" sources="$resolve.sources"></route-create>',
      resolve: {
        api: $route => ({id: $route.current.params.apiId}),
        sources: falcorModel =>
          falcorModel.get(
            ["sources", "by", "creation", {from: 0, length: 10}, ["id", "name", "kind"]]
          ).then(_.property(["json", "sources", "by", "creation"])),
      },
    })
})

.component("routeCreate", {
  templateUrl: "components/routeCreate/routeCreate.html",
  bindings: {
    api: "<",
    sources: "<",
  },
  controller($scope, $location, falcorModel) {
    const ctrl = this
    ctrl.route = {name: "Unamed route"}
    ctrl.submit = co.wrap(function* (route) {
      const response = yield falcorModel.call(
        ["apisById", ctrl.api.id, "routes", "create"],
        [route.name, route.matcher, route.source.id, route.query],
        ["id", "name", "matcher", "created", "query", ["source", "id"]],
        [["lastAdded"]])
      $scope.$apply(() => $location.path(`apis/${ctrl.api.id}/routes/${response.json.apisById[ctrl.api.id].routes.lastAdded.id}`))
    })
  },
})
