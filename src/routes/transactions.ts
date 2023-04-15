import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { knex } from '../database/database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'

export const transactionsRoutes = async (app: FastifyInstance) => {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const sessionId = request.cookies.sessionId

      const transactions = await knex('transactions').select('*').where({
        session_id: sessionId,
      })
      return {
        status: 'success',
        data: transactions ?? [],
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const createTransactionBodySchema = z.object({
        id: z.number({ coerce: true }),
      })
      const { id } = createTransactionBodySchema.parse(request.params)

      const sessionId = request.cookies.sessionId
      const transactions = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      return {
        status: 'success',
        data: transactions ?? null,
      }
    },
  )

  app.get('/summary', async (request) => {
    const summary = await knex('transactions')
      .sum('amount', {
        as: 'amount',
      })
      .first()

    return {
      status: 'success',
      data: summary,
    }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7: days
      })
    }

    await knex('transactions').insert({
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    reply.status(201).send()
  })
}
