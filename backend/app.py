from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config import Config
from routes.auth import auth_bp
from routes.profile import ensure_profile_tables, profile_bp


load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)

    try:
        ensure_profile_tables()
    except Exception as e:
        raise RuntimeError(f"❌ Database initialization failed: {e}") from e

    @app.get("/")
    def health_check():
        return jsonify({"message": "Loan management backend is running"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)