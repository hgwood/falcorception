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
const Firebase = require("firebase")
const mustache = require("mustache")
const requestPromise = require("request-promise")

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
          .orderBy("created", "asc")
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
      set(updates) {
        rw(data => {
          return _.merge(data, updates)
        })
        return {jsonGraph: updates}
      }
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
        const route = {
          id: shortid.generate(),
          name: args[0],
          method: args[1],
          matcher: args[2],
          created: new Date().toISOString(),
          source: {id: args[3]},
          query: args[4]
        }
        const newLength = rw(function (model) {
          model.apisById[apiId].routes[route.id] = route
          return model.apisById[apiId].routes.length += 1
        })
        const data = rw()
        const source = data.sources[route.source.id]
        runApi[apiId].push(createFalcorRoute(route, source))
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
          return model.apisById.length += 1
        })
        runApi(api)
        return {
          paths: [["apis", ["lastAdded", newLength - 1, "length"]]],
          jsonGraph: {
            apis: {
              lastAdded: {$type: "ref", value: ["apisById", id]},
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
      route: "sources.create",
      call(pathSet, args) {
        const source = {
          id: shortid.generate(),
          name: args[0],
          created: new Date().toISOString(),
          kind: args[1],
          config: args[2]
        }
        try {
          if (source.kind === "firebase") {
            new Firebase(source.config.url)
          }
          const newLength = rw(model => {
            model.sources[source.id] = source
            return model.sources.length += 1
          })
          return {
            paths: [["sources", ["lastAdded", "length"]]],
            jsonGraph: {
              sources: {
                lastAdded: {
                  $type: "ref",
                  value: ["sources", "by", "id", source.id]
                },
                length: newLength
              },
            },
          }
        } catch (e) {
           return {
            paths: [["sources", ["lastAdded"]]],
            jsonGraph: {
              sources: {
                lastAdded: {
                  $type: "error",
                  value: e.message
                },
              },
            },
          }
        }
      },
    },
    {
      route: "sources.by.creation[{keys:indices}]",
      get(pathSet) {
        const data = rw()
        return _(data.sources)
          .omit("length", "availableKinds")
          .values()
          .sortBy("created")
          .pick(pathSet.indices)
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
  const data = rw()
  const healthRoute = {
    route: "health",
    get(pathSet) {
      return {path: ["health"], value: "OK"}
    }
  }
  const routes = _(api.routes || {})
    .omit("length")
    .values()
    .map(route => {
      const source = data.sources[route.source.id]
      return createFalcorRoute(route, source)
    })
    .push(healthRoute)
    .value()
  runApi[api.id] = routes
  app.use(api.url, falcorExpress.dataSourceRoute(function () {
    return new falcorRouter(routes)
  }))
}

function createFalcorRoute(route, source) {
  return ({firebase: firebaseRoute, rest: restRoute, json: jsonRoute}[source.kind] || fakeRoute)(route, source.config)
}

function fakeRoute(routeDefinition) {
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      return [{path: firstPath, value: "The API is running this route but the route is not implemented"}]
    }
  }
}

function firebaseRoute(routeDefinition, sourceConfig) {
  const source = new Firebase(sourceConfig.url)
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      const renderedQuery = mustache.render(routeDefinition.query, pathSet)
      return source.child(renderedQuery).once("value").then(snapshot => {
        return [{path: firstPath, value: {$type: "atom", value: snapshot.val()}}]
      })
    }
  }
}

function restRoute(routeDefinition, sourceConfig) {
  const defaultOptions = {baseUrl: sourceConfig.url, json: true}
  const queryTemplate = _.template(routeDefinition.query)
  const locationTemplate = _.template(routeDefinition.location)
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet, args) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      const renderedQuery = queryTemplate(_.assign({}, pathSet, {args: _.map(args, arg => JSON.stringify(arg))}))
      const maybeJsonQuery = tryParseJson(renderedQuery)
      const requestOptions = _.defaults(maybeJsonQuery.json ? maybeJsonQuery.value : {url: maybeJsonQuery.value}, defaultOptions)
      return requestPromise(requestOptions).then(response => {
        const path = routeDefinition.method === "get" ? firstPath : _.toPath(locationTemplate(response))
        return [{path, value: {$type: "atom", value: response}}]
      })
    }
  }
}

function jsonRoute(routeDefinition, sourceConfig) {
  const model = JSON.parse(sourceConfig.json)
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      const renderedQuery = mustache.render(routeDefinition.query, pathSet)
      return [{path: firstPath, value: {$type: "atom", value: _.get(model, renderedQuery)}}]
    }
  }
}

function tryParseJson(maybeJsonString) {
  try {
    return {json: true, value: JSON.parse(maybeJsonString)}
  } catch (e) {
    return {json: false, value: maybeJsonString}
  }
}