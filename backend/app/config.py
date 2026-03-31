import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file (handle Korean path encoding)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=str(env_path), override=True)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
