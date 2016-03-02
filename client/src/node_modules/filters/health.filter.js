module.exports = angular.module("falcorception.healthFilter", []).filter("health", () => {
  return health => health ? "Running" : "Reaching..."
})
