module.exports = angular.module("falcorception.routeList", [
  require("../route/route").name,
]).component("routeList", {
  templateUrl: "components/routeList/routeList.html",
  bindings: {
    api: "<",
  },
})
