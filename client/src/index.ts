/// <reference path="../typings/index.d.ts" />

import lodash = require("lodash") // global _
require("angular") // global angular
require("angular-route") // load module

angular.module("falcorception", [
  "ngRoute",
  require("app/app").name,
])



import angular = require("angular")
