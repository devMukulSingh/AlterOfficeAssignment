import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authApp from './routes/auth.js'
import shortenApp from './routes/shorten.js'
import { type HttpBindings } from '@hono/node-server'; // import bindings
import analyticsApp from './routes/analytics.js'

export const app = new Hono<{ Bindings: HttpBindings }>()

app.use(cors())

app.get("/" , (c) => c.redirect("/auth/google-auth"))

app.get("/:userId", (c) => {
  const { userId } = c.req.param()
  return c.html(
    `<h1>Hey! this is your userId -> ${userId}. Request with your user id to generate short url or get analytics data </h1>`
  )
})


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


