const express = require("express");
const chromium = require("chrome-aws-lambda");
var cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3001;

async function generatePDF({ html = "", margin }) {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    ignoreHTTPSErrors: true,
    headless: true,
  });
  const page = await browser.newPage();

  await page.setContent(html);
  await page.emulateMediaType("print");
  const { bottom = "1cm", top = "1cm", left = "3cm", right = "1.5cm" } = margin;

  const pdfBuffer = await page.pdf({
    format: "a4",
    printBackground: true,
    margin: { bottom, top, left, right },
  });

  await page.close();
  await browser.close();

  return pdfBuffer;
}

// app.use(function (req, res, next) {
//   // Website you wish to allow to connect
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

//   // Request methods you wish to allow
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );

//   // Request headers you wish to allow
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type"
//   );

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader("Access-Control-Allow-Credentials", true);

//   // Pass to next layer of middleware
//   next();
// });

app.use(cors());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/create-pdf", async (req, res) => {
  const { styleTags = "", innerHTML = "", margin = {} } = JSON.parse(req.body);
  console.log({ innerHTML });
  const html = `<html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${styleTags}
      </style>
    </head>
    <body>
      ${innerHTML}
    </body>
  </html>
  `;
  const pdf = await generatePDF({ html, margin });
  res.setHeader("Content-Type", "application/pdf");
  res.send(pdf);
});

app.listen(PORT, (err) => {
  if (err) throw err;
  console.info(`App listening on port ${PORT}`);
});
