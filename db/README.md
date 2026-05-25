# DB Seed and MongoDB setup

This folder contains seed data and a simple seed script for the EatFit POS System. Below are step-by-step instructions to get a MongoDB database up and live (from zero), seed it with the provided data, and connect your project.

Files in this folder
- `ingredients.json` - initial ingredient documents (numeric `_id`).
- `menuItems.json` - initial menu item documents (numeric `_id`).
- `counters.json` - counter documents used by the app to auto-generate ids.
- `seed.js` - Node script that uses the project's Mongoose models to insert the above data.

Prerequisites
- Node.js installed (to run `db/seed.js`).
- MongoDB: either a MongoDB Atlas account (recommended) or local MongoDB server.

Step A — Create a MongoDB Atlas cluster (recommended)
1. Go to https://cloud.mongodb.com/ and register or sign in.
2. Create a new Project, then click "Build a Cluster" and choose the free tier (Shared Cluster).
3. Choose a cloud provider and region (pick one nearest your users).
4. Click "Create Cluster" and wait a few minutes for it to provision.

Step B — Create DB user and allow network access
1. In Atlas, go to "Database Access" → "Add New Database User". Create a username and strong password. Save these credentials.
2. Go to "Network Access" → "Add IP Address". For development, you can add your IP or temporarily allow access from anywhere using `0.0.0.0/0` (not recommended for production).

Step C — Get the connection string and add to your project
1. In Atlas, click "Connect" → "Connect your application" and copy the connection string (URI).
2. In your project root create a `.env` file (if not present) and add:

```powershell
MONGODB_URI="mongodb+srv://<USER>:<PASSWORD>@cluster0.xxxxx.mongodb.net/eatfit?retryWrites=true&w=majority"
```

Replace `<USER>` and `<PASSWORD>` with the DB user's credentials and adjust the DB name if desired.

Step D — Seed the database (two options)

Option 1 — Use the Node seed script (recommended)
1. Ensure `.env` has `MONGODB_URI` set.
2. From the project root run (PowerShell):

```powershell
node db/seed.js
```

This script will connect using your MONGODB_URI, clear `Ingredient`, `MenuItem`, and `Counter` collections, then insert the JSON data from this folder.

Option 2 — Use `mongoimport` (useful for direct JSON import)
1. Save the JSON files somewhere accessible (this repo's `db/` folder is fine).
2. Run these PowerShell commands (replace the URI and file paths):

```powershell
# Import ingredients
mongoimport --uri "mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/eatfit" --collection ingredients --file "d:\\DesignNetrix\\EATFIT\\EatFit-PosSytem\\db\\ingredients.json" --jsonArray --drop

# Import menu items
mongoimport --uri "mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/eatfit" --collection menuitems --file "d:\\DesignNetrix\\EATFIT\\EatFit-PosSytem\\db\\menuItems.json" --jsonArray --drop

# Import counters
mongoimport --uri "mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/eatfit" --collection counters --file "d:\\DesignNetrix\\EATFIT\\EatFit-PosSytem\\db\\counters.json" --jsonArray --drop
```

Notes about `mongoimport`:
- `--drop` will remove existing collection data before importing. Remove it if you want to append instead.
- If using a local MongoDB, replace the URI with `mongodb://localhost:27017/eatfit-possystem`.

Step E — Test locally
1. Start your app:

```powershell
# from project root
node server.js
```

2. Use Postman or curl to send a sample POST to create an order (example body):

```json
{
   "customerName": "John Doe",
   "customerPhone": "0771234567",
   "customerAddress": "123 Main St",
   "orderType": "Takeaway",
   "orderStatus": "Pending",
   "totalPrice": 5.5,
   "items": [
      { "menuItemId": 101, "quantity": 1, "selectedAddons": [] }
   ]
}
```

3. Verify data in MongoDB Atlas UI or MongoDB Compass: check `ingredients` and `menuitems` collections and see that `orders` collection has the saved order.

Step F — Deploy your backend and configure environment variables
You can deploy your Node app to hosting providers like Railway, Heroku, Render, or DigitalOcean App Platform. Example quick steps for Railway:
1. Create an account at https://railway.app/ and create a new project.
2. Connect your GitHub repo or upload code.
3. In Railway project settings, add an environment variable `MONGODB_URI` with the Atlas connection string.
4. Deploy and watch the logs. Your app should connect to Atlas using the env var.

Step G — Verify production and enable backups
- In Atlas, enable backups (available depending on cluster tier) and set up alerts for low disk, high CPU, or other metrics.

Troubleshooting
- If your app logs `MongoDB connected` you are good. If it shows a connection error, double-check `MONGODB_URI`, username/password`, and IP access list.
- If orders fail because ingredient IDs are missing, confirm that `menuItems.json` references existing ingredient `_id` values.

Security notes
- Never commit `.env` with credentials to source control. Use environment variables in your host (Railway, Heroku) instead.
- Avoid `0.0.0.0/0` IP allowlist in production — whitelist only required IPs.

If you want, I can:
- Add an `npm` script to `package.json` for seeding (e.g., `"seed": "node db/seed.js"`).
- Automatically create a small GitHub Actions workflow to run the seed on deploy (not recommended for production without safeguards).

If you'd like, I can add the `npm` script now — tell me to proceed and I'll add it.
