const express = require("express");
const chromium = require("chrome-aws-lambda");
var cors = require("cors");

const app = express();
// app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

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

app.post("/create-pdf", async (req, res) => {
  const { styleTags = "", innerHTML = "", margin = {} } = req.body;
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
