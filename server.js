const express = require('express');

const app = express();
const PORT = 5005;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
