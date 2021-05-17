import Fastify, { FastifyInstance } from 'fastify'
import FastifyRBAC from '../lib'
import { checkRBAC, retrieveAccountRoles } from './util'

describe('instance rbac', function () {
  let fastify: FastifyInstance

  beforeAll(async function () {
    fastify = Fastify()
    await fastify.register(FastifyRBAC, { retrieveAccountRoles, checkRBAC })
    fastify.get('/', { config: { rbac: { roles: 'index:read' } } }, async function () { return 'index:read' })
    fastify.post('/', { config: { rbac: { roles: ['index:create'] } } }, async function () { return 'index:create' })
    fastify.put('/', { config: {} }, async function () { return 'index:update' })
    fastify.delete('/', { config: { rbac: { roles: null } } }, async function () { return 'index:update' })
    fastify.route({ method: ['GET', 'PUT'], url: '/:id', config: { rbac: { roles: 'dynamic:all' } }, async handler () { return 'dynamic:all' } })
    await fastify.ready()
  })

  test('fastify.rbac', function () {
    expect(fastify.rbac.roles.length).toStrictEqual(3)
    expect(Array.from(fastify.rbac.routeRBAC.keys())).toStrictEqual(['GET:/', 'POST:/', 'GET:/:id', 'PUT:/:id'])
  })

  test('match rbac', async function () {
    const response = await fastify.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:read')
  })

  test('incorrect rbac', async function () {
    const response = await fastify.inject({ method: 'POST', url: '/' })
    expect(response.statusCode).toStrictEqual(403)
    expect(response.payload).toStrictEqual('{"statusCode":403,"error":"Forbidden","message":"No Privilege"}')
  })

  test('no rbac', async function () {
    const response = await fastify.inject({ method: 'PUT', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:update')
  })

  test('no rbac', async function () {
    const response = await fastify.inject({ method: 'DELETE', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:update')
  })

  test('dynamic params', async function () {
    const response = await fastify.inject({ method: 'GET', url: '/hello' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('dynamic:all')
  })

  test('cleared rbac', async function () {
    fastify.rbac.routeRBAC.clear()
    const response = await fastify.inject({ method: 'POST', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:create')
  })
})
