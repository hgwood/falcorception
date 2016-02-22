angular.module("falcorception.route", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:apiId/routes/:id", {
      template: '<route route="$resolve.route"></route>',
      resolve: {
        route: (falcorModel, $route) => 
          falcorModel.get(
            ["apisById", $route.current.params.apiId, ["id", "name"]],
            ["apisById", $route.current.params.apiId, "routes", "byIds", $route.current.params.id, ["id", "name", "matcher", "created"]]
          ).then(_.property(["json", "apisById", $route.current.params.apiId, "routes", "byIds", $route.current.params.id]))
      }
    })
})

.component("route", {
  templateUrl: "components/route.html",
  bindings: {
    route: "<"
  },
  controller(falcorModel, $scope) {
    const ctrl = this
    
  }
})
