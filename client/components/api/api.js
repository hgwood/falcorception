module.exports = angular.module("falcorception.api", [
  require("../../services/falcorModel.service").name,
  require("../../filters/health.filter").name,
  require("../jumbotron/jumbotron").name,
  require("../metric/metric").name,
  require("../falcorClient/falcorClient").name,
  require("../routeList/routeList").name,
  require("../routeCreate/routeCreate").name,
])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:id", {
      template: '<api api="$resolve.api"></api>',
      resolve: {
        api: (falcorModel, $route) =>
          falcorModel.get(
            ["apisById", $route.current.params.id, ["id", "name", "url"]],
            ["apisById", $route.current.params.id, "routes", "length"],
            ["apisById", $route.current.params.id, "routes", "mostRecentFirst", {from: 0, length: 10}, ["id", "name", "matcher", "created"]]
          ).then(_.property(["json", "apisById", $route.current.params.id])),
      },
    })
})

.component("api", {
  templateUrl: "components/api/api.html",
  bindings: {
    api: "=",
  },
  controller($scope, $location, falcorFactory) {
    const ctrl = this
    ctrl.createRoute = () => $location.path(`/apis/${ctrl.api.id}/route-create`)
    const model = falcorFactory(ctrl.api.url)
    model.get(["health"]).then(function () {
      ctrl.health = true
      $scope.$apply()
    })
  },
})
