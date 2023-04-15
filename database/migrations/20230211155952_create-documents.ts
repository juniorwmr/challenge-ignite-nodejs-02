import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary()
    table.string('title').notNullable()
    table.decimal('amount', 10, 2).notNullable()
    table.timestamp('create_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transactions')
}
