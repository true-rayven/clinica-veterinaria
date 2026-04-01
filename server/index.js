require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const app     = express();

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api", require("./routes/api"));

app.get("/", (_req, res) => res.json({ message: "Clinica Veterinaria API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

Select all with **Ctrl + A**, delete, paste this, save with **Ctrl + S**, then push:
```
git add .
git commit -m "fix: clean up index.js"
git push