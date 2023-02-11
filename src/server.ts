import { env } from './env'
import fastify from 'fastify'
import { knex } from './database/database'

const app = fastify()

app.get('/hello', async () => {
  const transaction = await knex('transactions').select('*')
  return transaction
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => console.log(`Server is running`))
