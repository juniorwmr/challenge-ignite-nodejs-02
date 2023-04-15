import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from 'src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('Should be able to create a new transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New Transaction',
      amount: 5000,
      type: 'credit',
    })

    expect(response.statusCode).toEqual(201)
  })

  it('Should be able to list all transactions', async () => {
    const transaction = {
      title: 'New Transaction',
      amount: 5000,
    }

    const transactionCreated = await request(app.server)
      .post('/transactions')
      .send({
        ...transaction,
        type: 'credit',
      })

    const cookie = transactionCreated.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toEqual([expect.objectContaining(transaction)])
  })

  it('Should be able to get a specific transaction', async () => {
    const transaction = {
      title: 'New Transaction',
      amount: 5000,
    }

    const transactionCreated = await request(app.server)
      .post('/transactions')
      .send({
        ...transaction,
        type: 'credit',
      })

    const cookie = transactionCreated.get('Set-Cookie')

    const transactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)

    expect(transactions.statusCode).toEqual(200)
    expect(transactions.body.data).toEqual([
      expect.objectContaining(transaction),
    ])

    const transactionId = transactions.body.data[0].id

    const response = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toEqual(expect.objectContaining(transaction))
    expect(response.body.data.id).toEqual(transactionId)
  })

  it.only('Should be able to get the summary', async () => {
    const firstTransactionCreated = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction - CREDIT 5000',
        amount: 5000,
        type: 'credit',
      })

    const cookie = firstTransactionCreated.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction - DEBIT 3000',
        amount: 3000,
        type: 'debit',
      })
      .set('Cookie', cookie)

    const response = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toEqual({
      amount: 2000,
    })
  })
})
