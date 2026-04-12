import express from 'express'
import routeNames from '../config/paypalRoutes.config'
import * as paypalController from '../controllers/paypalController'
import { publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.createPayPalOrder).post(...publicRoute(paypalController.createPayPalOrder))
routes.route(routeNames.checkPayPalOrder).post(...publicRoute(paypalController.checkPayPalOrder))

export default routes
