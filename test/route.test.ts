import Fastify, { FastifyInstance } from 'fastify'
import FastifyRBAC from '../lib'
import { checkRBAC, retrieveAccountRoles } from './util'

describe('route rbac', function () {
  let fastify: FastifyInstance

  beforeAll(async function () {
    fastify = Fastify()
    await fastify.register(FastifyRBAC, { retrieveAccountRoles, checkRBAC })
    fastify.get('/', { config: { rbac: { roles: 'index:read' } } }, async function () { return 'index:read' })
    fastify.post('/', { config: { rbac: { roles: ['index:create'], checkRBAC () { return true } } } }, async function () { return 'index:create' })
    await fastify.ready()
  })

  test('fastify.rbac', function () {
    expect(fastify.rbac.roles.length).toStrictEqual(2)
    expect(Array.from(fastify.rbac.routeRBAC.keys())).toStrictEqual(['GET:/', 'POST:/'])
  })

  test('match rbac', async function () {
    const response = await fastify.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:read')
  })

  test('override rbac check', async function () {
    const response = await fastify.inject({ method: 'POST', url: '/' })
    expect(response.statusCode).toStrictEqual(200)
    expect(response.payload).toStrictEqual('index:create')
  })
})
