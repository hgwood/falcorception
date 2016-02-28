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
      get: () => ({path: ["meta", "napis"], value: 2001}),
    },
    {
      route: "apis[{integers:indices}]",
      get(pathSet) {
        const data = rw()
        const apis = _(data.apisById)
          .omit("length")
          .values()
          .orderBy("created", "desc")
          .value()
        return _(pathSet.indices)
          .zipObject(pathSet.indices)
          .mapValues(_.propertyOf(apis))
          .pickBy(_.identity)
          .map((api, index) => ({path: ["apis", index], value: {$type: "ref", value: ["apisById", api.id]}}))
          .value()
      },
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
      route: "['apis', 'apisById'].length",
      get(pathSet) {
        return [{path: pathSet, value: rw().apisById.length}]
      },
    },
    {
      route: "apisById[{keys:ids}].routes.create",
      call(pathSet, args) {
        const apiId = pathSet.ids[0] // let's ignore the rest for now
        const routeName = args[0]
        const routeMatcher = args[1]
        const routeId = shortid.generate()
        const route = {
          id: routeId,
          name: routeName,
          matcher: routeMatcher,
          created: new Date().toISOString(),
          source: {id: args[2]},
          query: args[3]
        }
        const newLength = rw(function (model) {
          model.apisById[apiId].routes[route.id] = route
          return model.apisById[apiId].routes.length += 1
        })
        return _(route)
          .pickBy(_.negate(_.isObjectLike))
          .map((value, key) => {
            return {path: ["apisById", apiId, "routes", "byIds", route.id, key], value}
          })
          .push({path: ["apisById", apiId, "routes", "length"], value: newLength})
          .push({path: ["apisById", apiId, "routes", "lastAdded"], value: {$type: "ref", value: ["apisById", apiId, "routes", "byIds", route.id]}})
          .push({path: ["apisById", apiId, "routes", "mostRecentFirst", newLength - 1], value: {$type: "ref", value: ["apisById", apiId, "routes", "byIds", route.id]}})
          .value()
      },
    },
    {
      route: "apis.create",
      call(callPath, args) {
        const name = args[0]
        const id = shortid.generate()
        const created = new Date().toISOString()
        const url = `/${id}`
        const api = {id, name, created, url, routes: {length: 0}}
        const newLength = rw(function (model) {
          model.apisById[id] = api
          return model.apis.push(id)
        })
        runApi(api)
        return {
          paths: [["apis", [newLength - 1, "length"]]],
          jsonGraph: {
            apis: {
              [newLength - 1]: {$type: "ref", value: ["apisById", id]},
              length: newLength,
            },
          },
        }
      },
    },
    {
      route: "apisById[{keys:ids}].routes.mostRecentFirst[{integers:indices}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.ids)
          .zipObject(pathSet.ids)
          .mapValues(_.propertyOf(data.apisById))
          .mapValues("routes")
          .mapValues(routes => _.orderBy(_.values(_.omit(routes, "length")), ["created"], ["asc"]))
          .mapValues(routes => _.pick(routes, pathSet.indices))
          .flatMap((routes, apiId) => {
            return _.map(routes, (route, index) => {
              return {path: ["apisById", apiId, "routes", "mostRecentFirst", index], value: {$type: "ref", value: ["apisById", apiId, "routes", "byIds", route.id]}}
            })
          })
          .value()
      },
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
      },
    },
    {
      route: "apisById[{keys:apiIds}].routes.byIds[{keys:routeIds}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(pathSet.apiIds)
          .zipObject(pathSet.apiIds)
          .mapValues(_.propertyOf(data.apisById))
          .mapValues("routes")
          .mapValues(routes => _.pick(routes, pathSet.routeIds))
          .flatMap((routes, apiId) => {
            return _.flatMap(routes, (route, routeId) => {
              return _.map(pathSet.props, prop => {
                return {path: ["apisById", apiId, "routes", "byIds", routeId, prop], value: route[prop]}
              })
            })
          })
          .value()
      },
    },
    {
      route: "apisById[{keys:apiIds}].routes.byIds[{keys:routeIds}].source",
      get(pathSet) {
        const data = rw()
        return _(pathSet.apiIds)
          .zipObject(pathSet.apiIds)
          .mapValues(_.propertyOf(data.apisById))
          .mapValues("routes")
          .mapValues(routes => _.pick(routes, pathSet.routeIds))
          .flatMap((routes, apiId) => {
            return _.flatMap(routes, (route, routeId) => {
              return {
                path: ["apisById", apiId, "routes", "byIds", routeId, "source"],
                value: {$type: "ref", value: ["sources", "by", "id", route.source.id]},
              }
            })
          })
          .value()
      },
    },
    {
      route: "sources.by.creation[{keys:ids}]",
      get(pathSet) {
        const data = rw()
        return _(data.sources)
          .values()
          .pick(pathSet.ids)
          .map((source, index) => ({path: ["sources", "by", "creation", index], value: {$type: "ref", value: ["sources", "by", "id", source.id]}}))
          .value()
      },
    },
    {
      route: "sources.by.id[{keys:ids}][{keys:props}]",
      get(pathSet) {
        const data = rw()
        return _(data.sources)
          .pick(pathSet.ids)
          .flatMap(source => {
            return _.map(pathSet.props, prop => ({path: ["sources", "by", "id", source.id, prop], value: source[prop]}))
          })
          .value()
      },
    },
  ])
}))

app.listen(9009)

_(rw().apisById)
  .omit("length")
  .values()
  .each(runApi)

function rw(mutator) {
  const dataPath = path.join(__dirname, "data.json")
  const data = JSON.parse(fs.readFileSync(dataPath))
  const result = mutator ? mutator(data) : data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
  return result
}

function runApi(api) {
  app.use(api.url, falcorExpress.dataSourceRoute(function () {
    const healthRoute = {
      route: "health",
      get(pathSet) {
        return {path: ["health"], value: "OK"}
      }
    }
    const routes = _(api.routes)
      .omit("length")
      .values()
      .map(route => {
        return {
          route: route.matcher,
          get(pathSet) {
            const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
            return [{path: firstPath, value: "The API is running this route but the route is not implemented"}]
          }
        }
      })
      .push(healthRoute)
      .value()
    return new falcorRouter(routes)
  }))
}
