// server.js
//
// This is the entry point for the Clario backend.
// Its only job is to:
//   1. Load environment variables
//   2. Import the configured Express app
//   3. Start listening for HTTP requests
//
// It intentionally does NOT define routes or middleware itself -
// that all lives in src/app.js. This separation means app.js can be
// imported and tested on its own later (e.g. in automated tests)
// without ever starting a real network server.

require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Clario backend running on port ${PORT}`);
});
