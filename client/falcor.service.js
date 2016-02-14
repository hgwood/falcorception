angular.module("falcorception.falcor", []).service("falcorception", function () {
  return new falcor.Model({source: new falcor.HttpDataSource('/falcorception.json') })
})
