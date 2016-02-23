module.exports = angular.module("falcorception.jumbotron", []).component("jumbotron", {
  templateUrl: "components/jumbotron.html",
  transclude: true,
  bindings: {
    title: "@",
  },
})
