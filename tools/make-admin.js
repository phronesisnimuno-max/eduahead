/* Run before publishing:  node tools/make-admin.js "Your Name" you@school.ng "YourStrongPass1"
   Prints a hashed admin entry. Put it in data/db.json "users" and DELETE the demo users (their passwords are plain text in that file). */
const c = require("crypto"), [, , name, email, pw] = process.argv;
if (!pw || pw.length < 8) { console.log('Usage: node tools/make-admin.js "Name" email "Password(8+ chars, letters+numbers)"'); process.exit(1) }
const salt = "s" + c.randomBytes(4).toString("hex");
console.log(JSON.stringify({ id: "u1", name, role: "admin", email: email.toLowerCase(), salt, hash: c.createHash("sha256").update(salt + pw).digest("hex"), status: "active" }, null, 2));