require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));

app.use(express.json());

app.use("/api/auth", require("./routes/auth").router);
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api", require("./routes/api"));

app.get("/", (_req, res) => res.json({ message: "Clinica Veterinaria API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));