import { FastifyInstance } from 'fastify'
import { knex } from 'src/database/database'
import { z } from 'zod'

export const transactionsRoutes = async (app: FastifyInstance) => {
  app.get('/', async () => {
    const transactions = await knex('transactions').select('*')
    return {
      data: transactions,
    }
  })

  app.get('/:id', async (request) => {
    const createTransactionBodySchema = z.object({
      id: z.number({ coerce: true }),
    })
    const { id } = createTransactionBodySchema.parse(request.params)

    const transactions = await knex('transactions').where({ id }).first()

    return {
      data: transactions,
    }
  })

  app.get('/summary', async (request) => {
    const summary = await knex('transactions')
      .sum('amount', {
        as: 'amount',
      })
      .first()

    return {
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
    await knex('transactions').insert({
      title,
      amount: type === 'credit' ? amount : amount * -1,
    })

    reply.status(201).send()
  })
}
