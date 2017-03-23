/* global ace, markyMarkdown, hljs */

var renderTimeout

var markdownEditor = setupEditor('editor')
setupEvents(markdownEditor)

useMarkyVersion(document.getElementById('version').value)

function buildOptions () {
  function isChecked (id) {
    return document.getElementById(id).checked
  }

  return {
    sanitize: isChecked('sanitize'),
    linkify: isChecked('linkify'),
    highlightSyntax: isChecked('highlightSyntax'),
    prefixHeadingIds: isChecked('prefixHeadingIds'),
    enableHeadingLinkIcons: isChecked('enableHeadingLinkIcons'),
    serveImagesWithCDN: isChecked('serveImagesWithCDN'),
    package: isChecked('package')
  }
}

function highlightBlock (element) {
  hljs.highlightBlock(element)
}

function render () {
  var options = buildOptions()
  var outputTypeElements = document.getElementsByName('outputType')
  var viewTypes = Array.prototype.slice.call(outputTypeElements)
  var viewType = viewTypes.filter(function (e) { return e.checked })[0].value
  var outputNode = document.getElementById('output')

  document.getElementById('output-container').className = viewType

  var renderMap = {
    source: renderSource,
    debug: renderDebug,
    html: renderDocument
  }
  renderMap[viewType](markyMarkdown, markdownEditor, outputNode, options)
}

function renderDocument (marky, editor, outputNode, options) {
  var highlightSyntax = options.highlightSyntax
  options.highlightSyntax = false
  outputNode.innerHTML = marky(editor.getValue(), options)
  if (highlightSyntax) {
    document.querySelectorAll('#output pre code').forEach(highlightBlock)
  }
}

function renderSource (marky, editor, outputNode, options) {
  options.highlightSyntax = false
  var html = marky(editor.getValue(), options)
  outputNode.innerHTML = '<pre><code class="html">' + escapeText(html) + '</code></pre>'
  document.querySelectorAll('#output pre code').forEach(highlightBlock)
}

function renderDebug (marky, editor, outputNode, options) {
  if (marky.getParser) {
    options.highlightSyntax = false
    var parser = marky.getParser(options)
    var parserState
    parser.use(function (md, opts) {
      md.core.ruler.push('debugger', function (state) {
        parserState = state
      })
    })
    parser.render(editor.getValue())
    var debugInfo = JSON.stringify(parserState.tokens, null, '  ')
    outputNode.innerHTML = '<pre>' + escapeText(debugInfo) + '</pre>'
  } else {
    outputNode.innerHTML = '<em>Selected version of marky-markdown does not have the debugging features necessary to make the debug view work. :(</em>'
  }
}

function escapeText (text) {
  var paragraph = document.createElement('p')
  var textNode = document.createTextNode(text)
  paragraph.appendChild(textNode)
  return paragraph.innerHTML
}

function useMarkyVersion (version) {
  if ('markyMarkdown' in window) { delete window.markyMarkdown }

  var head = document.getElementsByTagName('head')[0]
  var scripts = document.querySelectorAll('head script.marky-markdown')
  for (var i = 0; i < scripts.length; i++) {
    head.removeChild(scripts[i])
  }

  var scriptElement = document.createElement('script')
  scriptElement.onload = render
  scriptElement.src = 'js/marky-markdown-' + document.getElementById('version').value + '.min.js'
  scriptElement.id = 'marky-' + version
  scriptElement.className = 'marky-markdown'

  head.appendChild(scriptElement)
}

function setupEditor (id) {
  var editor = ace.edit('editor')

  editor.getSession().setMode('ace/mode/markdown')
  editor.getSession().setUseWrapMode(true)
  editor.setTheme('ace/theme/tomorrow')
  editor.setShowPrintMargin(false)
  editor.setOption('minLines', 50)
  editor.setOption('maxLines', 50000)

  editor.getSession().on('change', function (e) {
    if (renderTimeout) clearTimeout(renderTimeout)
    renderTimeout = setTimeout(render, 300)
  })

  return editor
}

function setupEvents (editor) {
  document.getElementById('version').addEventListener('change', function (e) {
    useMarkyVersion(this.value)
  })

  var optionsQuery = 'header input[type=checkbox], #version, #packageContents, input[name=outputType]'
  document.querySelectorAll(optionsQuery).forEach(function (element) {
    element.addEventListener('change', render)
  })

  document.getElementById('clear-editor').addEventListener('click', function (e) {
    editor.setValue('')
  })
}

