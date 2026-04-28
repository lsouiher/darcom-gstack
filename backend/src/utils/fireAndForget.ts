import * as logger from './logger'

export const fireAndForget = (label: string, promise: Promise<unknown>): void => {
  promise.catch((err) => {
    logger.warn(`[fireAndForget:${label}] ${String((err as Error)?.message || err)}`)
  })
}
