# elemsio-tw-jit

Elemsio TailwindCSS JIT Compiler that returns purged Tailwind CSS classes and their definitions, minimized!

# usage

classesStr can be the whole HTML page code

Optional:
extraClasses is an array of objects, see below and will be passed as classes with the @apply directive

```javascript
const extraClasses [
  {
    name: '.btn-primary',
    classesArray: [
      'bg-blue-500',
      'hover:bg-blue-600',
      'font-bold',
      'text-white',
      'cursor-pointer',
      'rounded'
    ]
  },
  {
    name: '.btn-secondary',
    classesArray: [
      'bg-gray-500',
      'hover:bg-gray-600',
      'font-bold',
      'text-white',
      'cursor-pointer',
      'rounded'
    ]
  }
]
```

# fetch

```javascript
const response = await fetch('http://localhost:3336/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    includeBase: true, // if you want to also get the entire reset part
    html: classesStr,
    extraClasses, // array of objects
  }),
})

if (!response.ok) {
  throw new Error('Failed to fetch TailwindCSS from JIT')
}

const compiledClasses = await response.text()
```

# MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
