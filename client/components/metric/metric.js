module.exports = angular.module("falcorception.metric", []).component("metric", {
  templateUrl: "components/metric/metric.html",
  bindings: {
    label: "@",
    value: "=",
    action: "&",
    actionLabel: "@",
  },
})