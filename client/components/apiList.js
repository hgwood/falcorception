angular.module("falcorception.apiList", []).component("apiList", {
  templateUrl: "components/apiList.html",
  transclude: true,
  bindings: {
    apis: "=",
  },
})
