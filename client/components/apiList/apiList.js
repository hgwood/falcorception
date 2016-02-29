module.exports = angular.module("falcorception.apiList", [
  require("../api/api").name,
]).component("apiList", {
  templateUrl: "components/apiList/apiList.html",
  bindings: {
    apis: "<",
  },
})
