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

const PORT = Number(process.env.PORT) || 3336
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 500

const { LRUCache } = require('lru-cache')

const cacheOptions = { max: CACHE_SIZE }
const cache = new LRUCache(cacheOptions)

app.use(express.json())

app.get('/', function (req, res) {
  res.send('Hello friend')
})

app.post('/generate', async (req, res) => {
  const { html, includeBase, extraClasses } = req.body

  // Validate input
  if (typeof html !== 'string' || html.trim() === '') {
    return res.status(422).send({ errors: ['html_is_required'] })
  }

  if (extraClasses && typeof extraClasses !== 'string') {
    return res.status(422).send({ errors: ['extra_classes_must_be_a_string'] })
  }

  // Generate cache key using a hash
  const crypto = require('crypto')
  const cacheKey = crypto
    .createHash('sha256')
    .update(JSON.stringify({ html, includeBase, extraClasses }))
    .digest('hex')

  // Check if the result is in the cache
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return res.send(cachedResult)
  }

  // Generate styles to process
  let stylesToProcess = `
    @import "tailwindcss/components";
    @import "tailwindcss/utilities";
  `
  if (includeBase) {
    stylesToProcess = `@import "tailwindcss/base";` + stylesToProcess
  }

  if (extraClasses) {
    if (/^[\s\S]*\{\s*@apply[\s\S]*;\s*\}[\s\S]*$/m.test(extraClasses)) {
      stylesToProcess += `
        ${extraClasses}
      `
    } else {
      console.warn('Invalid extraClasses format, ignoring input:', extraClasses)
    }
  }

  try {
    const result = await postcss([
      tailwindcss({
        content: [{ raw: html, extension: 'html' }],
      }),
    ]).process(stylesToProcess, { from: undefined })

    const css = result.css
    cache.set(cacheKey, css)
    res.send(css)
  } catch (error) {
    console.error('Error processing Tailwind CSS:', error)

    res.status(422).send({
      errors: [error.reason || error.message || 'Unknown error occurred'],
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
