import { DEFAULT_WriteOptions, InfluxDB, Point } from '@influxdata/influxdb-client'
import { Injector } from '@sailplane/injector'
import { Logger } from '@sailplane/logger'

const token = "whKxsVLMCtbkEEA8uQzeW9AWQmNHVMyYs8wPazbJUCIv5ku8405ags6WQ8wFYx-68rfSKjMgkhpJ5t2z0uXq8A=="
const url = 'http://localhost:8086'

const logger = new Logger('InfluxClient')

const flushBatchSize = DEFAULT_WriteOptions.batchSize

export class InfluxClient {
  client: InfluxDB

  constructor(client: InfluxDB) {
    this.client = client
  }

  async writeTransactions(transactions: Transaction[]): Promise<void> {
    try {
      logger.info('Writing transaction...')
      const writeClient = this.client.getWriteApi('local', 'tickets_sold')
      const points = transactions.map((transaction) => new Point("numberOfTicketSold")
        .tag("eventId", transaction.eventId)
        .intField("value", transaction.numberOfTicketsSold)
        .timestamp(transaction.timestamp)
      )

      points.forEach(async (point, index) => {
        writeClient.writePoint(point)
        if ((index + 1) % flushBatchSize === 0) {
          console.log(`flush writeApi: chunk #${(index + 1) / flushBatchSize}`)
          try {
            // write the data to InfluxDB server, wait for it
            await writeClient.flush()
          } catch (e) {
            console.error()
          }
        }
      })

      await writeClient.close()
      logger.info('Writing transaction done...')
    } catch(e) {
      logger.info('Error writing', e)
    }
  }

  async getNumberOfTicketsSoldInBetween(eventId: string, from: string, to: string): Promise<string> {
    const queryClient = this.client.getQueryApi('local')

    const query = `from(bucket: "tickets_sold")
      |> range(start: ${from}, stop: ${to})
      |> filter(fn: (r) => r["_measurement"] == "_measurement" or r["_measurement"] == "numberOfTicketSold")
      |> filter(fn: (r) => r["_field"] == "value")
      |> filter(fn: (r) => r["eventId"] == "${eventId}")
      |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
      |> cumulativeSum(columns: ["_value"])
    `

    return queryClient.queryRaw(query)
  }
}

const create = () => {
  const client = new InfluxDB({ url, token })
  return new InfluxClient(client)
}

Injector.register(InfluxClient, create)
