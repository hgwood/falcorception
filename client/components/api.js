const co = require("co")

module.exports = angular.module("falcorception.api", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:id", {
      template: '<api api="$resolve.api"></api>',
      resolve: {
        api: (falcorModel, $route) =>
          falcorModel.get(
            ["apisById", $route.current.params.id, ["id", "name"]],
            ["apisById", $route.current.params.id, "routes", "length"],
            ["apisById", $route.current.params.id, "routes", "mostRecentFirst", {from: 0, length: 10}, ["id", "name", "matcher", "created"]]
          ).then(_.property(["json", "apisById", $route.current.params.id])),
      },
    })
})

.component("api", {
  templateUrl: "components/api.html",
  bindings: {
    api: "=",
  },
  controller($location) {
    const ctrl = this
    ctrl.createRoute = () => $location.path(`/apis/${ctrl.api.id}/route-create`)
  },
})
