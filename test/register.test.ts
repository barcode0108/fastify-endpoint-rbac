import Fastify from 'fastify'
import FastifyRBAC from '../lib'
import { checkRBAC, retrieveAccountRoles } from './util'

describe('register', function () {
  test('no options', async function () {
    try {
      const fastify = Fastify()
      await fastify.register(FastifyRBAC)
      await fastify.ready()
      throw new Error('should not be here.')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toStrictEqual('"retrieveAccountRoles" must be function.')
    }
  })

  test('only retrieveAccountRoles', async function () {
    try {
      const fastify = Fastify()
      // @ts-expect-error
      await fastify.register(FastifyRBAC, { retrieveAccountRoles })
      await fastify.ready()
      throw new Error('should not be here.')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toStrictEqual('"checkRBAC" must be function.')
    }
  })

  test('all options', async function () {
    const fastify = Fastify()
    await fastify.register(FastifyRBAC, { retrieveAccountRoles, checkRBAC })
    await fastify.ready()
    expect('passed').toBeTruthy()
  })

  test('forbiddenMessage', async function () {
    const fastify = Fastify()
    await fastify.register(FastifyRBAC, { retrieveAccountRoles, checkRBAC, forbiddenMessage: 'goodbye' })
    fastify.post('/', { config: { rbac: { roles: ['index:create'] } } }, async function () { return 'index:create' })
    await fastify.ready()

    const response = await fastify.inject({ method: 'POST', url: '/' })
    expect(response.statusCode).toStrictEqual(403)
    expect(response.payload).toStrictEqual('{"statusCode":403,"error":"Forbidden","message":"goodbye"}')
  })
})
