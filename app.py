from flask import Flask, render_template, request, jsonify
import os
import json
from db_inspector import inspect_database, get_supported_dialects

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main page"""
    dialects = get_supported_dialects()
    return render_template('index.html', dialects=dialects)

@app.route('/inspect', methods=['POST'])
def inspect():
    """Inspect the database and return the schema information"""
    try:
        data = request.json
        dialect = data.get('dialect')
        host = data.get('host')
        port = data.get('port')
        username = data.get('username')
        password = data.get('password')
        database_name = data.get('database')
        
        # Validate required fields
        if not all([dialect, host, username, database_name]):
            return jsonify({"error": "Missing required connection parameters"}), 400
            
        # Convert port to int if provided
        if port:
            try:
                port = int(port)
            except ValueError:
                return jsonify({"error": "Port must be a number"}), 400
        
        # Inspect the database
        schema_info = inspect_database(
            dialect=dialect,
            host=host,
            port=port,
            username=username,
            password=password,
            database=database_name
        )
        
        return jsonify(schema_info)
    except Exception as e:
        app.logger.error(f"Error inspecting database: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)