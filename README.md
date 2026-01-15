# Ad Optimizer

Professional web application for optimizing ad campaigns from Excel data.

## Features
- **Excel Upload**: Upload `DATA.xlsx` to populate the database.
- **Optimization**: Calculate new budgets and tCPA targets.
- **Export**: Download results as Excel.
- **Editing**: Modify data directly in the dashboard.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Database Setup**:
    - Create a `.env` file in the root directory.
    - Add your PostgreSQL connection string:
      ```
      DATABASE_URL="postgresql://user:password@localhost:5432/adoptimizer"
      ```

3.  **Sync Database**:
    ```bash
    npx prisma db push
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## deployment
This project is ready for Vercel.
1. Push to GitHub.
2. Import to Vercel.
3. Add `DATABASE_URL` to Vercel Environment Variables.
4. Vercel will handle the build.
