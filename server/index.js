"use strict"

const _ = require("lodash")
const shortid = require("shortid")
const express = require("express")
const serveStatic = require("serve-static")
const bodyParser = require("body-parser")
const falcorRouter = require("falcor-router")
const falcorExpress = require("falcor-express")
const fs = require("fs")
const path = require("path")

const app = express()

app.use(serveStatic("../client"))

app.use(bodyParser.urlencoded({extended: false}))

app.use("/falcorception.json", falcorExpress.dataSourceRoute(function () {
  return new falcorRouter([
    {
      route: "meta.napis",
      get: () => ({path: ["meta", "napis"], value: 2001})
    },
    {
      route: "apis[{integers:indices}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.indices)
          .zipObject(pathSet.indices)
          .mapValues(_.propertyOf(data.apis))
          .pickBy(_.identity)
          .map((apiId, index) => ({path: ["apis", index], value: {$type: "ref", value: ["apisById", apiId]}}))
          .value()
      }
    },
    {
      route: "apisById[{keys:ids}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.ids)
          .map(_.propertyOf(data.apisById))
          .flatMap(api => _.map(pathSet.props, prop => ({path: ["apisById", api.id, prop], value: api[prop]})))
          .value()
      },
    },
    {
      route: "apisById[{keys:ids}].routes[{integers:indices}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.ids)
          .zipObject(pathSet.ids)
          .mapValues(_.propertyOf(data.apisById))
          .mapValues("routes")
          .mapValues(routes => _.pick(routes, pathSet.indices))
          .flatMap((routes, apiId) => {
            return _.flatMap(routes, (route, index) => {
              return _.map(pathSet.props, prop => {
                return {path: ["apisById", apiId, "routes", index, prop], value: route[prop]}
              })
            })
          })
          .value()
      }
    },
    {
      route: "apisById[{keys:ids}].routes.create",
      call(pathSet, args) {
        const apiId = pathSet.ids[0] // let's ignore the rest for now
        const routeName = args[0]
        const routePath = args[1]
        const routeId = shortid.generate()
        const route = {id: routeId, name: routeName, path: routePath}
        const newLength = rw(function (model) {
          return model.apisById[apiId].routes.push(route)
        })
        return _(route)
          .map((value, key) => {
            return {path: ["apisById", apiId, "routes", newLength - 1, key], value}
          })
          .push({path: ["apisById", apiId, "routes", "lastAdded"], value: {$type: "ref", value: ["apisById", apiId, "routes", newLength - 1]}})
          .value()
      }
    },
    {
      route: "apisById[{keys:ids}].routes.length",
      get(pathSet) {
        const data = rw()
        return _(pathSet.ids)
          .zipObject(pathSet.ids)
          .mapValues(_.propertyOf(data.apisById))
          .mapValues("routes.length")
          .map((length, apiId) => ({path: ["apisById", apiId, "routes", "length"], value: length}))
          .value()
      }
    },
    {
      route: "apis.create",
      call(callPath, args) {
        const name = args[0]
        const id = shortid.generate()
        const newLength = rw(function (model) {
          model.apisById[id] = {id, name, routes: [{id: shortid.generate()}]}
          return model.apis.push(id)
        })
        return {
          paths: [["apis", [newLength - 1, "length"]]],
          jsonGraph: {
            apis: {
              [newLength - 1]: {$type: "ref", value: ["apisById", id]},
              length: newLength
            },
          },
        }
      },
    },
  ])
}))

app.listen(9009)

function rw(mutator) {
  const dataPath = path.join(__dirname, "data.json")
  const data = JSON.parse(fs.readFileSync(dataPath))
  const result = mutator ? mutator(data) : data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
  return result
}
