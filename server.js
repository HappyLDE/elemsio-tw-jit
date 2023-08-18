const express = require('express')
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
require('dotenv').config()

const app = express()
const PORT = Number(process.env.PORT) || 3335
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 500

const { LRUCache } = require('lru-cache')

const cacheOptions = { max: CACHE_SIZE }
const cache = new LRUCache(cacheOptions)

app.use(express.json())

app.post('/generate', async (req, res) => {
  const { key, html } = req.body

  if (!key) {
    return res.status(400).send('server_key_is_required')
  }
  console.log('CACHE_SIZE', process.env.SERVER_KEY)
  console.log('key', key)
  console.log('process.env.SERVER_KEY', process.env.SERVER_KEY)
  if (key != process.env.SERVER_KEY) {
    return res.status(400).send('server_key_is_invalid')
  }

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
