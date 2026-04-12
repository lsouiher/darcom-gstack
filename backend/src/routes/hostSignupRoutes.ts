import express from 'express'
import routeNames from '../config/hostSignupRoutes.config'
import * as controller from '../controllers/hostSignupController'
import { publicRoute } from './_markers'
import { signupEnabledGuard } from '../middlewares/signupEnabledGuard'
import { loadSignupSession } from '../middlewares/loadSignupSession'
import { signupStartLimiter, signupPhoneLimiter, signupVerifyLimiter } from '../middlewares/rateLimit'

const routes = express.Router()

routes.route(routeNames.start).post(
  ...publicRoute(signupEnabledGuard, signupStartLimiter, signupPhoneLimiter, controller.start),
)
routes.route(routeNames.verifyPhone).post(
  ...publicRoute(signupEnabledGuard, signupVerifyLimiter, loadSignupSession, controller.verifyPhone),
)
routes.route(routeNames.details).post(
  ...publicRoute(signupEnabledGuard, loadSignupSession, controller.details),
)
routes.route(routeNames.complete).post(
  ...publicRoute(signupEnabledGuard, loadSignupSession, controller.complete),
)
routes.route(routeNames.current).get(
  ...publicRoute(signupEnabledGuard, loadSignupSession, controller.currentSession),
)

export default routes
