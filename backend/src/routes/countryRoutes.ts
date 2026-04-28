import express from 'express'
import routeNames from '../config/countryRoutes.config'
import * as countryController from '../controllers/countryController'
import { adminOnly, tenantScoped, publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.validate).post(...adminOnly(countryController.validate))
routes.route(routeNames.create).post(...adminOnly(countryController.create))
routes.route(routeNames.update).put(...adminOnly(countryController.update))
routes.route(routeNames.delete).delete(...adminOnly(countryController.deleteCountry))
routes.route(routeNames.getCountry).get(...tenantScoped(countryController.getCountry))
routes.route(routeNames.getCountries).get(...tenantScoped(countryController.getCountries))
routes.route(routeNames.getCountriesWithLocations).get(...publicRoute(countryController.getCountriesWithLocations))
routes.route(routeNames.checkCountry).get(...adminOnly(countryController.checkCountry))
routes.route(routeNames.getCountryId).get(...tenantScoped(countryController.getCountryId))

export default routes
