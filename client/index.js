require("lodash") // global _
require("angular") // global angular
require("angular-route") // load module
require("angular-xeditable-npm") //load module

angular.module("falcorception", [
  "ngRoute",
  "xeditable",
  require("./components/app").name,
  require("./components/jumbotron").name,
  require("./components/metric").name,
  require("./components/apiList/apiList").name,
  require("./components/api").name,
  require("./components/routeList").name,
  require("./components/route").name,
  require("./components/source").name,
  require("./services/falcor.service").name,
  require("./services/falcorModel.service").name
]).run(xEditable)

function xEditable(editableOptions) {
  editableOptions.theme = 'bs3';
}