const express = require('express')
const cors = require('cors')
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
require('dotenv').config()

const app = express()

app.use(cors())
// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

const PORT = Number(process.env.PORT) || 3335
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 500

const { LRUCache } = require('lru-cache')

const cacheOptions = { max: CACHE_SIZE }
const cache = new LRUCache(cacheOptions)

app.use(express.json())

app.get('/', function (req, res) {
  res.send('Hello friend')
})

app.post('/generate', async (req, res) => {
  const { html } = req.body

  if (!html) {
    return res.status(400).send('html_is_required')
  }

  // Check if the result is in the cache
  const cachedResult = cache.get(html)
  if (cachedResult) {
    return res.send(cachedResult)
  }

  try {
    const result = await postcss([
      tailwindcss({
        mode: 'jit',
        content: [{ raw: html, extension: 'html' }],
      }),
    ]).process(
      '@import "tailwindcss/base"; @import "tailwindcss/components"; @import "tailwindcss/utilities";',
      {
        from: undefined,
      }
    )

    const css = result.css
    cache.set(html, css)
    res.send(css)
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to process CSS')
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
