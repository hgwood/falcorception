angular.module("falcorception.falcorModel", []).service("falcorModel", function (falcor) {
  return new falcor.Model({source: new falcor.HttpDataSource('/falcorception.json') }).batch()
})
