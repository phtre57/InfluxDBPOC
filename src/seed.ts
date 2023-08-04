import { Injector } from "@sailplane/injector";
import { faker } from '@faker-js/faker';
import { Logger } from '@sailplane/logger'

import { InfluxClient } from "./InfluxClient";

const logger = new Logger('seed.ts')

const influx = Injector.get(InfluxClient)!

const numberOfTransactions = new Array(20000).fill(0)

const date = new Date("2023-07-15T00:00:00.000Z")

const createTransaction = (date: Date): Transaction => ({
  timestamp: date,
  numberOfTicketsSold: faker.number.int({
     max: 10
  }),
  eventId: faker.helpers.arrayElement(["1", "2", "3"])
})

const transactions = numberOfTransactions.map((_, index) => {
  date.setMinutes(date.getMinutes() + 1)
  return createTransaction(new Date(date))
})

console.log(transactions.slice(0, 10), transactions.slice(-10, -1))

influx.writeTransactions(transactions)
  .then(() => logger.info('DONE'))
  .catch(() => logger.info('FAIL'))