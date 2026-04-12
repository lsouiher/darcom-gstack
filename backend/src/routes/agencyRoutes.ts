import express from 'express'
import routeNames from '../config/agencyRoutes.config'
import * as agencyController from '../controllers/agencyController'
import { adminOnly, tenantScoped, publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.validate).post(...adminOnly(agencyController.validate))
routes.route(routeNames.update).put(...tenantScoped(agencyController.update))
routes.route(routeNames.delete).delete(...adminOnly(agencyController.deleteAgency))
routes.route(routeNames.getAgency).get(...tenantScoped(agencyController.getAgency))
routes.route(routeNames.getAgencies).get(...adminOnly(agencyController.getAgencies))
routes.route(routeNames.getAllAgencies).get(...publicRoute(agencyController.getAllAgencies))

export default routes
