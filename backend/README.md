# Code_d_Code Backend

## Overview
This is the backend API for the Code_d_Code club website. It handles form submissions, membership applications, and data management using Node.js, Express, and PostgreSQL.

## Setup Instructions
1. Clone the repository.
2. Install dependencies:
	```bash
	npm install
	```
3. Set up your PostgreSQL database using `config/schema.sql`.
4. Configure environment variables in Render or copy `.env.production` and update values:
	- Generate a new JWT secret:
	  ```bash
	  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
	  ```
	- Change the default admin password and hash in the database.
	- Set correct `DATABASE_URL`, `FRONTEND_URL`, and other secrets.

## Deployment (Render)
1. Create a new Render Web Service.
2. Add all required environment variables from `.env.production` (do NOT use the example secrets).
3. Set `NODE_ENV=production`.
4. Deploy and verify health at `/health` endpoint.

## Security Checklist
- Change all secrets before deploying.
- Remove default admin password from database.
- Restrict database user permissions.
- Enable SSL for database connections.
- Monitor logs and errors.

## Troubleshooting
- Check logs for errors.
- Use `/health` endpoint for status.
- Ensure database is reachable from Render.

## Testing
Run tests before deploying:
```bash
npm test
```

## Contact
For issues, open a GitHub issue or contact the Code_d_Code Society.
