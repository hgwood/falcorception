require("lodash") // global _
require("angular") // global angular
require("angular-route") // load module

angular.module("falcorception", [
  "ngRoute",
  require("./components/app").name,
  require("./components/jumbotron").name,
  require("./components/metric").name,
  require("./components/apiList/apiList").name,
  require("./components/api").name,
  require("./components/routeList").name,
  require("./components/route").name,
  require("./components/routeCreate").name,
  require("./components/source").name,
  require("./services/falcor.service").name,
  require("./services/falcorModel.service").name,
  require("./filters/health.filter").name,
])
