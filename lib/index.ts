import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import FastifyPlugin from 'fastify-plugin'

export interface RBACRouteConfig {
  rbac?: {
    roles?: string | string[]
    checkRBAC?: CheckRBAC
  }
}

export type RetrieveAccountRoles = (request: FastifyRequest, reply: FastifyReply) => string[] | Promise<string[]>
export type CheckRBAC = (routeRoles: string[], accountRoles: string[]) => boolean | Promise<boolean>

export interface FastifyRBACOptions {
  retrieveAccountRoles: RetrieveAccountRoles
  checkRBAC: CheckRBAC
  forbiddenMessage?: string
}

declare module 'fastify' {
  interface FastifyInstance {
    rbac: {
      routeRBAC: Map<string, string[]>
      roles: string[]
    }
  }
}

const plugin: FastifyPluginAsync<FastifyRBACOptions> = async function (fastify, options) {
  if (typeof options.retrieveAccountRoles !== 'function') throw new Error('"retrieveAccountRoles" must be function.')
  if (typeof options.checkRBAC !== 'function') throw new Error('"checkRBAC" must be function.')
  if (typeof options.forbiddenMessage !== 'string') options.forbiddenMessage = 'No Privilege'

  const routeRBAC: Map<string, string[]> = new Map()
  const roles: string[] = []
  const rbac = { routeRBAC, roles }

  // collect all roles
  fastify.addHook('onRoute', function (routeOptions) {
    const methods = Array.isArray(routeOptions.method) ? routeOptions.method : [routeOptions.method]
    methods.forEach(function (method) {
      const key = `${method}:${routeOptions.path}`
      const config = routeOptions.config as RBACRouteConfig
      if (!routeRBAC.has(key) && typeof config === 'object' && typeof config.rbac === 'object' && (Array.isArray(config.rbac.roles) || typeof config.rbac.roles === 'string')) {
        const roles = Array.isArray(config.rbac.roles) ? config.rbac.roles : [config.rbac.roles]
        rbac.roles = rbac.roles.concat(roles)
        routeRBAC.set(key, roles)
      }
    })
  })

  // add preHandler
  fastify.addHook<{}, RBACRouteConfig>('preHandler', async function (request, reply) {
    // skip preHandler if rbac is not set
    if (typeof reply.context.config.rbac !== 'object') return null
    if (!Array.isArray(reply.context.config.rbac.roles) && typeof reply.context.config.rbac.roles !== 'string') return null
    const key = `${request.method}:${request.routerPath}`
    const routeRoles = routeRBAC.get(key)
    if (!Array.isArray(routeRoles)) return null
    // @ts-expect-error
    const accountRoles = await options.retrieveAccountRoles.call(this, request, reply)
    const checkRBAC = reply.context.config.rbac.checkRBAC ?? options.checkRBAC
    // @ts-expect-error
    const passed = await checkRBAC.call(this, routeRoles, accountRoles)
    if (!passed) {
      const err: Error & { statusCode?: number } = new Error(options.forbiddenMessage)
      err.statusCode = 403
      throw err
    }
    return null
  })

  fastify.addHook('onReady', async function () {
    // dedup rbac roles
    rbac.roles = Array.from(new Set(rbac.roles))
  })

  fastify.decorate('rbac', rbac)
}

export const FastifyRBAC = FastifyPlugin(plugin, {
  fastify: '3.x',
  name: 'fastify-rbac',
  dependencies: []
})
export default FastifyRBAC
