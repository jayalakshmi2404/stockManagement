require("dotenv").config();

console.log("GMAIL:", process.env.GMAIL_APP_PASSWORD);
console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);
