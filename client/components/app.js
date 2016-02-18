angular.module("falcorception.app", [])

.config(function ($routeProvider) {
  $routeProvider
    .when("/falcorception", {
      template: '<app napis="$resolve.napis" apis="$resolve.apis"></app>',
      resolve: {
        napis: falcorModel => falcorModel.get("meta.napis").then(_.property("json.meta.napis")),
        apis: falcorModel => falcorModel.get("apis[0..50]['id', 'name']").then(_.property("json.apis"))
      },
    })
    .otherwise("/falcorception")
})

.component("app", {
  templateUrl: "components/app.html",
  bindings: {
    napis: "=",
    apis: "=",
  },
  controller(falcorModel, $scope) {
    const ctrl = this
    ctrl.createApi = co.wrap(function* () {
      const response = yield falcorModel.call("apis.create", ["someName"], [["name"], ["id"]], ["[0..5]['name']"])//.then(response => {
      ctrl.apis = Array.from(response.json.apis).slice(0, 5)
      ctrl.napis += 1
      $scope.$apply()
    })
  },
})
