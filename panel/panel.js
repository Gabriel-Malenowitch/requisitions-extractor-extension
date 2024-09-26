import Van from  '../libs/van.js'
const { div, main, h2, button, p, textarea, br, un, li, code } = Van.tags

const VARS = [
  'method',
  'url',
  'undecodedUrl',
  'urlWithoutQueryParams',
  'httpVersion',
  'headers',
  'queryString',
  'cookies',
  'headersSize',
  'bodySize',
  'body',
  'response'
]

const build_var_name = (value) => `\$\{${value}\}`

const DEFAULT_TEMPLATE = `
{
  "method": "${build_var_name('method')}",
  "url": "${build_var_name('url')}",
  "query_params": "${build_var_name('queryString')}",
  "response": "${build_var_name('response')}"
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
    if(request.request.method !== "OPTIONS"){
      request.getContent(value => {
        reqList.rawVal.push({
          ...request?.request,
          urlWithoutQueryParams: request?.request?.url?.substring(0, /\?/.exec(request?.request?.url)?.index),
          undecodedUrl: request?.request?.url,
          response: JSON.parse(JSON.stringify(value))
        })
      })
    }
  });

  const handleSubmit = () => {
    const parseQueryParams = (input) => {
      const result = {}
      input.forEach(item => {
        if (item.value.includes("%")) {
          result[item.name] = JSON.parse(decodeURIComponent(item.value))
        } else {
          result[item.name] = item.value
        }
      })

      return result
    };

    reqList.rawVal.forEach(req => {
      const text = document.getElementById("textarea").value
      
      const content = text.replace(/\$\{(\w+)\}/g, (_, varName) => {
        if(varName === 'url'){
          return decodeURIComponent(req[varName])
        }

        if(varName === 'queryString'){
            console.log(req[varName])
           return JSON.stringify(parseQueryParams(req[varName]))
        }
        
        return req[varName] || ""
      })

      downloadJSON(content, req.urlWithoutQueryParams)
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
