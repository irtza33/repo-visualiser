# Database Relationship Visualizer

A web application that visualizes database schema relationships including primary keys, foreign keys, and table dependencies (1:1, 1:M, M:M relationships).

## Features

- Connect to multiple database types (PostgreSQL, MySQL, SQL Server, Oracle, SQLite)
- Automatic detection of table relationships
- Interactive visualization of database schema
- Identification of relationship types (1:1, 1:M, M:M)
- Detailed information about each relationship
- Drag-and-drop interface to arrange tables
- Zoom and pan functionality for large schemas

## Requirements

- Python 3.6+
- Flask
- SQLAlchemy
- Database drivers:
  - PostgreSQL: psycopg2-binary
  - MySQL: pymysql
  - SQL Server: pyodbc (optional)
  - Oracle: cx_Oracle (optional)
  - SQLite: built-in

## Installation

1. Clone this repository:

```
git clone https://github.com/yourusername/db-visualizer.git
cd db-visualizer
```

2. Create and activate a virtual environment:

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```
pip install flask sqlalchemy psycopg2-binary pymysql cryptography
```

4. Run the application:

```
python app.py
```

5. Open your browser and navigate to:

```
http://localhost:5000
```

## Usage

1. Open the application in your browser
2. Select your database type
3. Enter the connection details:
   - Host (e.g., localhost)
   - Port (default will be selected based on database type)
   - Username
   - Password
   - Database name
4. Click "Connect & Visualize"
5. Explore the interactive visualization:
   - Drag tables to rearrange them
   - Click on relationships to see details
   - Zoom and pan to navigate large schemas

## Database Support

- **PostgreSQL**: Full support
- **MySQL**: Full support
- **SQLite**: Full support
- **Microsoft SQL Server**: Basic support
- **Oracle**: Basic support

## Technical Details

The application uses:

- **Backend**: Python Flask
- **ORM**: SQLAlchemy for database inspection
- **Frontend**: Vanilla JavaScript with D3.js for visualization
- **Security**: Passwords are not stored and only used for connection

## License

MIT License
