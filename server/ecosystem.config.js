module.exports = {
  apps: [{
    name: "clinica-server",
    script: "index.js",
    cwd: "C:\\Users\\Admin\\Downloads\\Clinica_Veterinaria_Prototype\\clinica\\server",
    env: {
      NODE_ENV: "production",
      DB_HOST: "localhost",
      DB_USER: "root",
      DB_PASSWORD: "Root1234!",
      DB_NAME: "clinica_db",
      JWT_SECRET: "clinica_secret_key_2024",
      JWT_EXPIRES_IN: "7d",
      PORT: "5000",
      EMAIL_USER: "rayven.bantug@cvsu.edu.ph",
      EMAIL_PASS: "edwayqpoyvzwqdet",
      EMAIL_HOST: "smtp.gmail.com",
      EMAIL_PORT: "587"
    }
  }]
}