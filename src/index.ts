import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authApp from './routes/auth.js'
import shortenApp from './routes/shortenApp.js'

const app = new Hono()

app.use("/api/*",cors())

app.get("/" , (c) => c.json("hello"))

app.use(logger())

app.route("/auth",authApp)
app.route("/api/shorten",shortenApp)

const port = 3000

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
