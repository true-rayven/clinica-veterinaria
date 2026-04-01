require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api", require("./routes/api"));

app.get("/", (_req, res) => res.json({ message: "Clinica Veterinaria API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

1. Open `server/index.js`
2. **Ctrl + A** to select all
3. Delete
4. Paste this
5. **Ctrl + S**

Then in terminal:
```
git add .
git commit -m "fix: open CORS"
git push