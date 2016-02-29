module.exports = angular.module("falcorception.route", [
  require("../../services/falcorModel.service").name,
  require("../jumbotron/jumbotron").name,
  require("../metric/metric").name,
  require("../source/source").name,
])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:apiId/routes/:id", {
      template: '<route route="$resolve.route"></route>',
      resolve: {
        route: (falcorModel, $route) =>
          falcorModel.get(
            ["apisById", $route.current.params.apiId, ["id", "name"]],
            ["apisById", $route.current.params.apiId, "routes", "byIds", $route.current.params.id, ["id", "name", "matcher", "created"]],
            ["apisById", $route.current.params.apiId, "routes", "byIds", $route.current.params.id, "source", ["id", "name", "kind"]]
          ).then(_.property(["json", "apisById", $route.current.params.apiId, "routes", "byIds", $route.current.params.id])),
      },
    })
})

.component("route", {
  templateUrl: "components/route/route.html",
  bindings: {
    route: "<",
  },
  controller($location) {
    const ctrl = this
    ctrl.goToSource = function () {
      $location.path(`/sources/${ctrl.route.source.id}`)
    }
  },
})