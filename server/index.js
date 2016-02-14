"use strict"

const express = require("express")
const falcorRouter = require("falcor-router")
const falcorExpress = require("falcor-express")

const app = express()

app.use("/falcorception.json", falcorExpress.dataSourceRoute(function () {
  return new falcorRouter()
}))
