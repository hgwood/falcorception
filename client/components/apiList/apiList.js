module.exports = angular.module("falcorception.apiList", []).component("apiList", {
  templateUrl: "components/apiList/apiList.html",
  bindings: {
    apis: "<",
  },
  controller : function($location) {
    var ctrl = this;

    ctrl.click = function($event, api) {
      if($event.target.localName === "div") {
        $location.path("/apis/" + api.id)
      }
    }
  }
})
