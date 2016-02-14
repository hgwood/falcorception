angular.module("falcorception.metric", []).component("metric", {
  templateUrl: "components/metric.html",
  bindings: {
    label: "@",
    value: "=",
    action: "&",
    actionLabel: "@",
  },
})
