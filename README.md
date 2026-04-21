# RateMyStudent

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js (v18+ recommended) & npm
- MongoDB Atlas (or a running MongoDB instance)

### Backend Setup
1. Clone the repository and navigate to the project root.
2. Create a `.env` file in the root directory with the following:
   ```
   MONGO_URI=your_mongodb_connection_string
   SECRET_KEY=your_secret_key
   ```
   > **Note:** See how to create and connect a MongoDB Atlas cluster here: https://www.mongodb.com/docs/atlas/getting-started/.  
   > The `SECRET_KEY` can be any random string; it is used for cryptographic signing (e.g., session tokens).
3. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. (Optional) Populate the database with example data:
   ```sh
   python example_data.py
   ```
5. Start the backend server:
   ```sh
   python app.py
   ```
   The backend will run on http://localhost:5000 by default.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. Install frontend dependencies:
   ```sh
   npm install
   ```
3. Start the frontend dev server:
   ```sh
   npm run dev
   ```
   The frontend will run on http://localhost:5173 (or another port if in use).

### Usage
- Open the frontend in your browser. You can sign up, log in, search for students, view profiles, and leave reviews.
- The backend and frontend communicate via REST API endpoints. All API routes are proxied in development for convenience.

### Notes
- Make sure your MongoDB URI is correct and accessible from your machine.
- The default admin account is created automatically with username `admin` and password `admin123`.
- To reset or seed the database, use `example_data.py`.

---
