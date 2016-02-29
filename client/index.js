require("lodash") // global _
require("angular") // global angular
require("angular-route") // load module

angular.module("falcorception", [
  "ngRoute",
  require("./components/app/app").name,
])
