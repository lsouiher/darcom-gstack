import express from 'express'
import routeNames from '../config/hostSignupRoutes.config'
import * as controller from '../controllers/hostSignupController'
import { publicRoute, tenantScoped, adminOnly } from './_markers'
import * as hostAdmin from '../controllers/hostAdminController'
import { signupEnabledGuard } from '../middlewares/signupEnabledGuard'
import { loadSignupSession } from '../middlewares/loadSignupSession'
import { signupStartLimiter, signupPhoneLimiter, signupVerifyLimiter, signupDetailsLimiter, signupCompleteLimiter, signupTokenLimiter } from '../middlewares/rateLimit'

const routes = express.Router()

routes.route(routeNames.start).post(
  ...publicRoute(signupEnabledGuard, signupStartLimiter, signupPhoneLimiter, controller.start),
)
routes.route(routeNames.verifyPhone).post(
  ...publicRoute(signupEnabledGuard, signupVerifyLimiter, loadSignupSession, controller.verifyPhone),
)
routes.route(routeNames.details).post(
  ...publicRoute(signupEnabledGuard, signupDetailsLimiter, loadSignupSession, controller.details),
)
routes.route(routeNames.complete).post(
  ...publicRoute(signupEnabledGuard, signupCompleteLimiter, loadSignupSession, controller.complete),
)
routes.route(routeNames.current).get(
  ...publicRoute(signupEnabledGuard, loadSignupSession, controller.currentSession),
)
routes.route(routeNames.sessionFromToken).post(
  ...publicRoute(signupTokenLimiter, controller.consumeSignupToken),
)
routes.route(routeNames.onboarding).get(
  ...tenantScoped(controller.getOnboardingChecklist),
)
routes.route(routeNames.pendingReview).get(
  ...adminOnly(hostAdmin.listPendingReviewAgencies),
)
routes.route(routeNames.approveFirstPayout).patch(
  ...adminOnly(hostAdmin.approveFirstPayout),
)

export default routes
