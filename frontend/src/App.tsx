import React, { useState } from 'react';
import { Row, Col, Grid, Button, Loader, Panel, Dropdown } from 'rsuite'
import MonacoEditor from 'react-monaco-editor';

interface LogEntry {
  mode: "log" | "error"
  args: string[]
}

interface FileWrapper {
  publicURL: string
  filename: string
  mimetype: string
}

interface APIResponse {
  "files": FileWrapper[]
  "logs": LogEntry[]
}

interface Example {
  title: string
  code: string
}

const Examples: Example[] = [
  {
    title: "Page screenshot",
    code: `for (const browserType of ['chromium', 'firefox', 'webkit']) {
  const browser = await playwright[browserType].launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://whatsmyuseragent.org/');
  await page.screenshot({ path: \`example-\${browserType}.png\` });
  await browser.close();
}`
  }, {
    title: "Mobile and geolocation",
    code: `const { webkit, devices } = playwright;
const iPhone11 = devices['iPhone 11 Pro'];
const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: iPhone11.viewport,
  userAgent: iPhone11.userAgent,
  geolocation: { longitude: 12.492507, latitude: 41.889938 },
  permissions: { 'https://www.google.com': ['geolocation'] }
});
const page = await context.newPage();
await page.goto('https://maps.google.com');
await page.click(".ml-my-location-fab button");
await page.waitForRequest(/.*preview\\/pwa/);
await page.screenshot({ path: 'colosseum-iphone.png' });
await browser.close();`
  }, {
    title: "Generate a PDF",
    code: `const browser = await playwright.chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('https://www.google.com/search?q=Google');
await page.pdf({ path: \`document.pdf\` });
await browser.close();`
  },
]

const App = () => {
  const [code, setCode] = useState<string>(Examples[0].code)
  const [loading, setLoading] = useState<boolean>(false)
  const [resp, setResponse] = useState<APIResponse | null>()
  const handleChangeCode = (newValue: string) => setCode(newValue)
  const handleExection = () => {
    setLoading(true)
    fetch("/api/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code
      })
    }).then(resp => resp.ok ? resp.json() : Promise.reject(resp.text()))
      .then(resp => {
        setResponse(resp)
        setLoading(false)
      })
  }
  const getDropdownTitle = () => {
    const item = Examples.find(item => item.code === code)
    if (item) {
      return item.title
    }
    return "Custom"
  }
  return (
    <Grid>
      <Row className="show-grid">
        <Col xs={24}>
          <h1>Playwright Playground</h1>
        </Col>
        <Col xs={24} md={12}>
          {loading && <Loader center content="loading" backdrop style={{ zIndex: 10 }} />}
          <Panel header={<>
            Examples{' '}
            <Dropdown title={getDropdownTitle()}>
              {Examples.map(({ title }, index) => <Dropdown.Item key={index} onSelect={() => setCode(Examples[index].code)}>{title}</Dropdown.Item>)}
            </Dropdown>
          </>} bordered>
            <MonacoEditor
              onChange={handleChangeCode}
              language="typescript"
              value={code}
              height={500}
              options={{
                minimap: {
                  enabled: false
                },
              }}
            />
            <Button onClick={handleExection} style={{ position: "absolute", top: 20, right: 20 }}>
              Run
          </Button>
          </Panel>
        </Col>
        <Col xs={24} md={12}>
          <Panel header="Output:" bordered>
            {resp && <>
              {resp.logs.length > 0 && <h3>Logs</h3>}
              <code>{resp.logs.map((entry, i) => entry.args.join())}</code>{resp.logs.map((entry, i) => entry.args.join())}
              <h3>Files</h3>
              {resp.files.map(({ publicURL, filename, mimetype }, i) => <p key={i} style={{ marginBottom: 10 }}>
                {filename}
                {mimetype === "application/pdf" ? <>
                  <object type="application/pdf" data={publicURL} style={{
                    display: "block",
                    width: "100%",
                    minHeight: 500
                  }} />
                </> : <>
                    <img src={publicURL} alt={filename} style={{ width: "100%", borderRadius: 4 }} />
                  </>}
              </p>)}
            </>}
          </Panel>
        </Col>
      </Row>
    </Grid >
  );
}

export default App;
