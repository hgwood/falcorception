angular.module("falcorception.app", []).component("app", {
  templateUrl: "components/app.html",
  controller(falcorModel) {
    falcorModel.get("meta['napis', 'nrequests']").then((response) => {
      this.napis = response.json.meta.napis
    })
  },
})
