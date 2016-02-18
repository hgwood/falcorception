angular.module("falcorception.api", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/apis/:id", {
      template: '<api api="$resolve.api"></api>',
      resolve: {
        api: (falcorModel, $route) => 
          falcorModel.get(
            ["apisById", $route.current.params.id, "name"],
            ["apisById", $route.current.params.id, "routes", [{from: 0, length: 10}, "length"], ["id", "pattern"]]
          ).then(_.property(["json", "apisById", $route.current.params.id]))
      }
    })
})

.component("api", {
  templateUrl: "components/api.html",
  bindings: {
    api: "="
  },
})
