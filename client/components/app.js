angular.module("falcorception.app", []).component("app", {
  templateUrl: "components/app.html",
  controller: function (falcorception) {
    falcorception.get("meta['napis', 'nrequests']").then((response) => {
      this.napis = response.json.meta.napis
    })
  },
})
