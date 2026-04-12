import express from 'express'
import routeNames from '../config/stripeRoutes.config'
import * as stripeController from '../controllers/stripeController'
import { publicRoute } from './_markers'

const routes = express.Router()

// Stripe checkout endpoints are called from the unauthenticated frontend checkout flow.
// Auth boundary is Stripe session signature verification inside the controller.
routes.route(routeNames.createCheckoutSession).post(...publicRoute(stripeController.createCheckoutSession))
routes.route(routeNames.checkCheckoutSession).post(...publicRoute(stripeController.checkCheckoutSession))
routes.route(routeNames.createPaymentIntent).post(...publicRoute(stripeController.createPaymentIntent))

export default routes
