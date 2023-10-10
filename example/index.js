const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
// const docIndexController = require('./src/controllers/docIndex');
// const promptsController = require("./src/controllers/prompt");
// const fnsController = require("./src/controllers/function");
// const execController = require("./src/controllers/executable");
const pathrouter = require("./src/utils/pathrouter");


// parse application/json
app.use(bodyParser.json());
app.use(cors());

const messageOut = msg => (req, res, next) => {
  return res.status(200).json({
    message: msg,
  });
};

app.use(pathrouter('./src/routes'));

// app.get("/", messageOut("Hello from root!"))


// app.get("/path", messageOut("Hello from path!"));


// app.get('/docs', messageOut("db.getDocs is not here")) //db.getDocs)
// app.post('/docs/query', docIndexController.queryDocs) //db.getDocs)
// app.get('/docs/:id', messageOut("db.getDocById is not here"))// db.getDocById)
// app.post('/docs', docIndexController.createDocIndex); // indexing task
// app.put('/docs/:id', messageOut("db.updateDocIndex is not here")); //db.updateDocIndex) // updaTE index
// app.delete('/docs/:id', messageOut("db.deleteDoc is not here")) // db.deleteDoc)

// app.post('/prompts', promptsController.savePrompt);
// app.get('/prompts', promptsController.getPrompts);

// app.post('/fns', fnsController.saveFn);
// app.get('/fns', fnsController.getFns);

// // enduser calls
// app.get('/exec/fn/:fnid', execController.execFn); // see https://wasmedge.org/book/en/write_wasm/js/npm.html
// app.get('/exec/prompt/:promptid', execController.execPrompt);


// Experimental
// app.post('/autogpt')

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
module.exports = { handler: serverless(app), app };

