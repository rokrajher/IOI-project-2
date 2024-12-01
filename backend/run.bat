@echo off
REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r req.txt

REM Run the backend
echo Starting backend...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

REM Deactivate virtual environment after server stops
call venv\Scripts\deactivate