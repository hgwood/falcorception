require("angular") // global angular
require("angular-route") // load module

angular.module("falcorception", [
  "ngRoute",
  require("app/app").name,
])
