angular.module("falcorception.api", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:id", {
      template: '<api api="$resolve.api"></api>',
      resolve: {
        api: (falcorModel, $route) => 
          falcorModel.get(
            ["apisById", $route.current.params.id, ["id", "name"]],
            ["apisById", $route.current.params.id, "routes", [{from: 0, length: 10}, "length"], ["id", "name", "pattern"]]
          ).then(_.property(["json", "apisById", $route.current.params.id]))
      }
    })
})

.component("api", {
  templateUrl: "components/api.html",
  bindings: {
    api: "="
  },
  controller(falcorModel, $scope) {
    const ctrl = this
    ctrl.createRoute = co.wrap(function* () {
      const response = yield falcorModel.call(
        ["apisById", ctrl.api.id, "routes", "create"], 
        ["someRouteName"], 
        ["id"], 
        [["length"]])
      const routes = response.json.apisById[ctrl.api.id].routes
      const route = routes.lastAdded
      ctrl.api.routes[route.id] = route
      ctrl.api.routes.length = routes.length
      $scope.$apply()
    })
  }
})
