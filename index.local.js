// index.local.js
const app = require("./server");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor local en http://localhost:${PORT}`);
});
