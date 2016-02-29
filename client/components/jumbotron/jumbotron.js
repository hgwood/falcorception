module.exports = angular.module("falcorception.jumbotron", []).component("jumbotron", {
  templateUrl: "components/jumbotron/jumbotron.html",
  transclude: true,
  bindings: {
    title: "@",
  },
})
