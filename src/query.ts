import { Injector } from "@sailplane/injector"
import { Logger } from "@sailplane/logger"
import { InfluxClient } from "InfluxClient"

const influx = Injector.get(InfluxClient)!

const logger = new Logger('query.ts')

influx.getNumberOfTicketsSoldInBetween("1", "2023-07-17T13:00:00.000Z", "2023-07-17T14:00:00.000Z")
  .then((response) => logger.info('DONE with response', response))
  .catch((e) => logger.info('FAIL', e))