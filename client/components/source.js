module.exports = angular.module("falcorception.source", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/sources/:id", {
      template: '<source source="$resolve.source"></source>',
      resolve: {
        source: (falcorModel, $route) =>
          falcorModel.get(
            ["sources", "by", "id", $route.current.params.id, ["id", "name", "kind"]]
          ).then(_.property(["json", "sources", "by", "id", $route.current.params.id])),
      },
    })
})

.component("source", {
  templateUrl: "components/source.html",
  bindings: {
    source: "<",
  },
})
