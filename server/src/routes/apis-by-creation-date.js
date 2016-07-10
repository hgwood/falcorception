const _ = require("lodash")
const co = require("co")

module.exports = apiRepository => ({
  route: "apis[{integers:indices}]",
  get: co.wrap(function* (paths) {
    apiRepository = yield apiRepository
    const ids = yield apiRepository.find()
      .sort({created: 1})
      .project({"id": true})
      .map(api => api.id)
      .toArray()
    return _(ids)
      .pickBy((id, index) => index in paths.indices)
      .map((id, index) => ({
        path: ["apis", index],
        value: {$type: "ref", value: ["apisById", id]}
      }))
      .value()
  }),
})
