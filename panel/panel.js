import Van from  '../libs/van.js'
const { div, main, h2, button, p, textarea, br, un, li, code } = Van.tags

const VARS = [
  'method',
  'url',
  'httpVersion',
  'headers',
  'queryString',
  'cookies',
  'headersSize',
  'bodySize',
  'body',
]

const build_var_name = (value) => `\$\{${value}\}`

const DEFAULT_TEMPLATE = `
{
  "method": "${build_var_name('method')}",
  "url": "${build_var_name('url')}",
  "query_string": "${build_var_name('queryString')}",
}
`

const downloadJSON = (content, fileName) => {
  const jsonContent = "data:text/json;charset=utf-8," + content
  const encodedUri = encodeURI(jsonContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", fileName + ".json")
  // document.body.appendChild(link) // Required for firefox -> don't use firefox

  link.click()
}


const Content = () => {
  const reqList = Van.state([])
  
  chrome.devtools.network.onRequestFinished.addListener((request) => {
    request.getContent(value => {
        reqList.rawVal.push({
          ...request?.request,
          response: value
        })
      })
  });

  const handleSubmit = () => {
    console.log(reqList)
    reqList.rawVal.forEach(req => {
      const fileName = req.url?.substring(0, /\?/.exec(req.url)?.index)
      const text = document.getElementById("textarea").value
      
      const content = text.replace(/\$\{(\w+)\}/g, (_, varName) => {
        const objectResult = String(req[varName]).startsWith("\"\"") ? String(req[varName]) : JSON.stringify(req[varName])
        const parsedResult = String(objectResult).includes("%") ? decodeURIComponent(objectResult) : objectResult  
        return parsedResult || ""
      })

downloadJSON(`
{
  requisition: ${content},
  response: ${JSON.stringify(JSON.parse(req.response))}
}
`, fileName)
    })
  }

  return main(
      h2("How do you want to format the texts:"),
      p("Use ${variable_name} to insert var value (JSONs will be parsed)."),
      un(
        VARS.map(var_name => 
          li(code(`\$\{${var_name}\}`)
        ))
      ),
      br(),
      div(
        textarea({
          value: DEFAULT_TEMPLATE,
          id: 'textarea'
        }),
        button({ 
            onclick: handleSubmit
        }, 'Download files')
      )
  )
}

Van.add(document.body, Content())
