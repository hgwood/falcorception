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
const requestPromise = require("request-promise")
const {MongoClient} = require("mongodb")

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
        return rw().then(data => {
          const apis = _(data.apisById)
            .omit("length")
            .values()
            .orderBy("created", "asc")
            .value()
          return _(pathSet.indices)
            .zipObject(pathSet.indices)
            .mapValues(_.propertyOf(apis))
            .pickBy(_.identity)
            .map((api, index) => ({
              path: ["apis", index],
              value: {$type: "ref", value: ["apisById", api.id]}}))
            .value()
        })
      },
    },
    {
      route: "apisById[{keys:ids}][{keys:props}]",
      get(pathSet) {
        return rw().then(data => {
          return _(pathSet.ids)
            .map(_.propertyOf(data.apisById))
            .flatMap(api => _.map(pathSet.props, prop => ({
              path: ["apisById", api.id, prop],
              value: api[prop]})))
            .value()
        })
      },
      set(updates) {
        rw(data => {
          return _.merge(data, updates)
        }).then(() => ({jsonGraph: updates}))
      }
    },
    {
      route: "['apis', 'apisById'].length",
      get(pathSet) {
        return rw().then(data => {
          return [{path: pathSet, value: data.apisById.length}]
        })
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
        return rw(function (model) {
          model.apisById[apiId].routes[route.id] = route
          return model.apisById[apiId].routes.length += 1
        }).then(newLength => Promise.all([newLength, rw()]))
        .then(([newLength, data]) => {
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
        })
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
        return rw(function (model) {
          model.apisById[id] = api
          return model.apisById.length += 1
        }).then(newLength => {
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
        })
      },
    },
    {
      route: "apisById[{keys:ids}].routes.mostRecentFirst[{integers:indices}]",
      get(pathSet) {
        return rw().then(data => {
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
        })
      },
    },
    {
      route: "apisById[{keys:ids}].routes.length",
      get(pathSet) {
        return rw().then(data => {
          return _(pathSet.ids)
            .zipObject(pathSet.ids)
            .mapValues(_.propertyOf(data.apisById))
            .mapValues("routes.length")
            .map((length, apiId) => ({path: ["apisById", apiId, "routes", "length"], value: length}))
            .value()
        })
      },
    },
    {
      route: "apisById[{keys:apiIds}].routes.byIds[{keys:routeIds}][{keys:props}]",
      get(pathSet) {
        return rw().then(data => {
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
        })
      },
    },
    {
      route: "apisById[{keys:apiIds}].routes.byIds[{keys:routeIds}].source",
      get(pathSet) {
        return rw().then(data => {
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
        })
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
          return rw(model => {
            model.sources[source.id] = source
            return model.sources.length += 1
          }).then(newLength => {
            const refToNewSource = {
              $type: "ref",
              value: ["sources", "by", "id", source.id]
            }
            return {
              paths: [["sources", ["lastAdded", "length"]], ["sources", "by", "creation", newLength]],
              jsonGraph: {
                sources: {
                  by: {creation: {[newLength]: refToNewSource}},
                  lastAdded: refToNewSource,
                  length: newLength,
                },
              },
            }
          })
        } catch (e) {
           return {
            paths: [["sources", ["lastAdded"]]],
            jsonGraph: {
              sources: {
                lastAdded: {
                  $type: "error",
                  value: e.message,
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
        return rw().then(data => {
          return _(data.sources)
            .omit("length", "availableKinds")
            .values()
            .sortBy("created")
            .pick(pathSet.indices)
            .map((source, index) => ({path: ["sources", "by", "creation", index], value: {$type: "ref", value: ["sources", "by", "id", source.id]}}))
            .value()
        })
      },
    },
    {
      route: "sources.by.id[{keys:ids}][{keys:props}]",
      get(pathSet) {
        return rw().then(data => {
          return _(data.sources)
            .pick(pathSet.ids)
            .flatMap(source => {
              return _.map(pathSet.props, prop => ({path: ["sources", "by", "id", source.id, prop], value: source[prop]}))
            })
            .value()
        })
      },
    },
  ])
}))

app.listen(9009)


const mongo = MongoClient.connect("mongodb://localhost:27017/falcorception").then(db => {
  console.log("db connected")
  return db
}).catch(err => {
  throw err
})
const closeDb = () => mongo.then(db => {
  console.log("closing db")
  db.close()
})
process.on("exit", closeDb)
process.on("SIGINT", closeDb)
process.on("SIGTERM", closeDb)

function rw(mutator) {
  return mongo.then(db => {
    return Promise.all([db, db.collection("falcorception").findOne({})])
  })
  .then(([db, data]) => {
    const result = mutator ? mutator(data) : data
    return Promise.all([db.collection("falcorception").findOneAndReplace({}, data, {upsert: true}), result, data])
  })
  .then(([,result]) => result)
}

rw().then(data => {
  _(data.apisById)
    .omit("length")
    .values()
    .each(runApi)
})

function runApi(api) {
  return rw().then(data => {
    const healthRoute = {
      route: "health",
      get() {
        return {path: ["health"], value: "OK"}
      },
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
  })
}

function createFalcorRoute(route, source) {
  return ({firebase: firebaseRoute, rest: restRoute}[source.kind] || fakeRoute)(route, source.config)
}

function fakeRoute(routeDefinition) {
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      return [{path: firstPath, value: "The API is running this route but the route is not implemented"}]
    },
  }
}

function firebaseRoute(routeDefinition, sourceConfig) {
  const source = new Firebase(sourceConfig.url)
  const queryTemplate = _.template(routeDefinition.query)
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet) {
      const firstPath = _.map(pathSet, subpath => _.isArray(subpath) ? subpath[0] : subpath)
      const renderedQuery = queryTemplate(pathSet)
      return source.child(renderedQuery).once("value").then(snapshot => {
        return [{path: firstPath, value: {$type: "atom", value: snapshot.val()}}]
      })
    },
  }
}

function restRoute(routeDefinition, sourceConfig) {
  const defaultOptions = {baseUrl: sourceConfig.url, json: true}
  const queryTemplate = _.template(routeDefinition.query)
  const locationTemplate = _.template(routeDefinition.location)
  return {
    route: routeDefinition.matcher,
    [routeDefinition.method](pathSet, args) {
      if (routeDefinition.method === "call") {
        const requestOptions = renderRequestOptions(pathSet, args)
        return requestPromise(requestOptions).then(response => {
          const path = _.toPath(locationTemplate(response))
          const value = {$type: "atom", value: response}
          return [{path, value}]
        })
      } else if (routeDefinition.queryRendering === "once") {
        return Promise.all([runGet(pathSet)])
      } else {
        return Promise.all(_.map(expandPreservingShortcuts(pathSet), path => {
          return runGet(path)
        }))
      }
    },
  }
  function runGet(pathOrPathSet) {
    runGet.cache = runGet.cache || {}
    const requestOptions = renderRequestOptions(pathOrPathSet)
    const responsePromise = _.has(runGet.cache, requestOptions.url) ?
      Promise.resolve(runGet.cache[requestOptions.url]) :
      requestPromise(requestOptions)
    return responsePromise.then(response => {
      runGet.cache[requestOptions.url] = response
      const path = _.toArray(pathOrPathSet)
      const falcorResponse = buildFalcorResponse(path, response)
      const value = {$type: "atom", value: falcorResponse}
      return {path, value}
    })
  }
  function renderRequestOptions(path, args) {
    const renderedQuery = queryTemplate(_.assign({}, path, {args: _.map(args, arg => JSON.stringify(arg))}))
    const maybeJsonQuery = tryParseJson(renderedQuery)
    const requestOptions = _.defaults(maybeJsonQuery.json ? maybeJsonQuery.value : {url: maybeJsonQuery.value}, defaultOptions)
    return requestOptions
  }
  function buildFalcorResponse(path, restResponse) {
    const pathToRestResponse = _.takeWhile(path, pathSegment => !_.has(restResponse, pathSegment))
    const falcorResponse = _.set({}, pathToRestResponse, restResponse)
    return _.get(falcorResponse, path)
  }
}

function tryParseJson(maybeJsonString) {
  try {
    return {json: true, value: JSON.parse(maybeJsonString)}
  } catch (e) {
    return {json: false, value: maybeJsonString}
  }
}

/**
 * Same as `expand` but preserves shortcut properties.
 *
 * {0: "a", 1: ["b", "c"], 2: "d", ids: ["b", "c"]} -> [
 *   {0: "a", 1: "b", 2: "d", ids: "b"},
 *   {0: "a", 1: "c", 2: "d", ids: "c"}
 * ]
 */
function expandPreservingShortcuts(pathSet) {
  const pathSetWithoutShortcuts = _.toArray(pathSet)
  const indicesOfShortcuts = _(pathSet)
    .omit("length")
    .pickBy((value, key) => isNaN(Number(key)))
    .mapValues(pathSegments => _.indexOf(pathSetWithoutShortcuts, pathSegments))
    .value()
  return _.map(expand(pathSet), path => {
    const shortcuts = _.mapValues(indicesOfShortcuts, _.propertyOf(path))
    return _.assign(shortcuts, path, {length: path.length})
  })
}

/**
 * Expands a compressed path set into the corresponding set of full paths.
 *
 * ["a", ["b", "c"], "d"] -> [["a", "b", "d"], ["a", "c", "d"]]
 */
function expand(pathSet) {
  if (_.isEmpty(pathSet)) return [[]]
  const head = _.head(pathSet)
  const headPathSegments = _.isArray(head) ? head : [head]
  return _.flatMap(headPathSegments, headPathSegment => {
    return _.map(expand(_.tail(pathSet)), pathSetTail => {
      return [headPathSegment, ...pathSetTail]
    })
  })
}
