import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authApp from './routes/auth.js'
import shortenApp from './routes/shorten.js'
import { type HttpBindings } from '@hono/node-server'; // import bindings
import analyticsApp from './routes/analytics.js'

const app = new Hono<{ Bindings: HttpBindings }>()

app.use(cors())

app.get("/" , (c) => c.json("hello"))

app.use(logger())

app.route("/auth",authApp)
app.route("/api/shorten",shortenApp)
app.route("/api/analytics",analyticsApp)
const port = Number(process.env.PORT)  || 3000

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
