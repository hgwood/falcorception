angular.module("falcorception.app", []).component("app", {
  templateUrl: "components/app.html",
  controller(falcorModel) {
    falcorModel.get("meta['napis', 'nrequests']").then(response => {
      this.napis = response.json.meta.napis
    })
    this.createApi = () => {
      falcorModel.call("apis.create", ["someName"], [["name"], ["id"]], ["[0..5]['name']"]).then(response => {
        this.apis = response.json.apis
      })
    }
  },
})
