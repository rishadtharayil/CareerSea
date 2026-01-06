# CareerSea

Career guidance application with Django backend and React frontend.

## Structure

- `backend/`: Django API for career data and roadmap generation.
- `frontend/`: React/Vite UI for user interaction.

## Setup

### Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   ..\venv\Scripts\activate
   # Linux/Mac
   source ../venv/bin/activate
   ```
   *(Note: The `venv` is expected to be in the project root based on the current structure, adjust if necessary)*

3. Install dependencies:
   ```bash
   pip install django djangorestframework django-cors-headers
   # Add other dependencies as needed
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- Career Roadmap Generation
- Questionnaire for personalized suggestions
