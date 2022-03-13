const express = require("express");
// const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 3001;

async function generatePDF({ html = "", margin }) {
  const browser = await puppeteer.launch({
    // args: chromium.args,
    // args: ["--no-sandbox", "--disable-setuid-sandbox"],
    args: ["--no-sandbox", "--font-render-hinting=none"],
    // defaultViewport: chromium.defaultViewport,
    // executablePath: await chromium.executablePath,
    ignoreHTTPSErrors: true,
    headless: true,
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle2" });
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

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/create-pdf", async (req, res) => {
  const { styleTags = "", innerHTML = "", margin = {} } = req.body;

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
  res.status(200).send(pdf);
});

app.listen(PORT, (err) => {
  if (err) throw err;
  console.info(`App listening on port ${PORT}`);
});
