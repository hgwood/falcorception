angular.module("falcorception.source", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/sources/:id", {
      template: '<source source="$resolve.source"></source>',
      resolve: {
        route: (falcorModel, $route) => 
          falcorModel.get(
            ["sources", $route.current.params.id, ["id", "name", "kind"]]
          ).then(_.property(["json", "sources", $route.current.params.id]))
      }
    })
})

.component("source", {
  templateUrl: "components/source.html",
  bindings: {
    source: "<"
  },
  controller(falcorModel, $scope) {
    const ctrl = this
  }
})
