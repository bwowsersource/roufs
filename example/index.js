const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
// const docIndexController = require('./src/controllers/docIndex');
// const promptsController = require("./src/controllers/prompt");
// const fnsController = require("./src/controllers/function");
// const execController = require("./src/controllers/executable");
const pathrouter = require("../src");


// parse application/json
app.use(bodyParser.json());
app.use(cors());

const messageOut = msg => (req, res, next) => {
  return res.status(200).json({
    message: msg,
  });
};

app.use(pathrouter('./example/routestest'));

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


app.use((err, req, res, next) => {
  console.log(err)
  if (res.headersSent) {
    return next(err)
  }
  return res.status(err.status || 500).send(err)

})
module.exports = { /*handler: serverless(app),*/ app };

