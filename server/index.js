"use strict"

const _ = require("lodash")
const express = require("express")
const serveStatic = require("serve-static")
const falcorRouter = require("falcor-router")
const falcorExpress = require("falcor-express")

const app = express()

app.use(serveStatic("../client"))

app.use("/falcorception.json", falcorExpress.dataSourceRoute(function () {
  return new falcorRouter([
    {
      route: "meta.napis",
      get: () => ({path: ["meta", "napis"], value: 2001})
    }
  ])
}))

app.listen(9009)
