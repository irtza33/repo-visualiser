from sqlalchemy import create_engine, inspect, MetaData
from sqlalchemy.exc import SQLAlchemyError
import json

def get_supported_dialects():
    """Returns a list of supported database dialects"""
    return [
        {"id": "postgresql", "name": "PostgreSQL", "default_port": 5432},
        {"id": "mysql", "name": "MySQL", "default_port": 3306},
        {"id": "mssql", "name": "Microsoft SQL Server", "default_port": 1433},
        {"id": "oracle", "name": "Oracle", "default_port": 1521},
        {"id": "sqlite", "name": "SQLite", "default_port": None},
    ]

def create_connection_string(dialect, username, password, host, port, database):
    """Create a database connection string based on dialect"""
    if dialect == 'sqlite':
        return f"{dialect}:///{database}"
    
    # Add port if provided
    port_str = f":{port}" if port else ""
    
    # Format password correctly for URL
    password_str = f":{password}" if password else ""
    
    return f"{dialect}://{username}{password_str}@{host}{port_str}/{database}"

def inspect_database(dialect, host, username, password=None, port=None, database=None):
    """
    Inspect a database and return information about its schema, tables, and relationships
    """
    try:
        # Create connection string
        connection_string = create_connection_string(
            dialect=dialect,
            username=username,
            password=password,
            host=host,
            port=port,
            database=database
        )
        
        # Create engine and connect to database
        engine = create_engine(connection_string)
        inspector = inspect(engine)
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        # Get all tables
        tables = inspector.get_table_names()
        
        # Initialize the result structure
        schema_info = {
            "database": database,
            "tables": [],
            "relationships": []
        }
        
        # Gather information about each table
        for table_name in tables:
            table_info = {
                "name": table_name,
                "columns": [],
                "primary_keys": inspector.get_pk_constraint(table_name)["constrained_columns"],
                "unique_constraints": [],
            }
            
            # Get columns
            for column in inspector.get_columns(table_name):
                column_info = {
                    "name": column["name"],
                    "type": str(column["type"]),
                    "nullable": column["nullable"],
                    "primary_key": column["name"] in table_info["primary_keys"]
                }
                table_info["columns"].append(column_info)
            
            # Get unique constraints
            for unique_constraint in inspector.get_unique_constraints(table_name):
                table_info["unique_constraints"].append({
                    "name": unique_constraint["name"],
                    "columns": unique_constraint["column_names"]
                })
            
            schema_info["tables"].append(table_info)
        
        # Find relationships between tables
        for table_name in tables:
            # Get foreign keys for each table
            foreign_keys = inspector.get_foreign_keys(table_name)
            
            for fk in foreign_keys:
                relationship = {
                    "source_table": table_name,
                    "source_columns": fk["constrained_columns"],
                    "target_table": fk["referred_table"],
                    "target_columns": fk["referred_columns"],
                    "name": fk.get("name"),
                    # Determine relationship type (1:1, 1:M, M:M)
                    "type": determine_relationship_type(
                        schema_info, 
                        table_name, 
                        fk["referred_table"], 
                        fk["constrained_columns"],
                        fk["referred_columns"]
                    )
                }
                schema_info["relationships"].append(relationship)
        
        return schema_info
        
    except SQLAlchemyError as e:
        raise Exception(f"Database connection error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error inspecting database: {str(e)}")

def determine_relationship_type(schema_info, source_table, target_table, source_columns, target_columns):
    """
    Determine the type of relationship between tables:
    - 1:1 (one-to-one): if both sides have unique constraints on their columns
    - 1:M (one-to-many): if only the target side has unique constraints
    - M:1 (many-to-one): if only the source side has unique constraints
    - M:M (many-to-many): if neither side has unique constraints
    """
    # Find the source and target tables in schema_info
    source_table_info = next((t for t in schema_info["tables"] if t["name"] == source_table), None)
    target_table_info = next((t for t in schema_info["tables"] if t["name"] == target_table), None)
    
    if not source_table_info or not target_table_info:
        return "unknown"
    
    # Check if source columns are part of a unique constraint or primary key
    source_is_unique = False
    for col in source_columns:
        if col in source_table_info["primary_keys"]:
            source_is_unique = True
            break
        
        for constraint in source_table_info.get("unique_constraints", []):
            if col in constraint["columns"] and len(constraint["columns"]) == len(source_columns):
                source_is_unique = True
                break
    
    # Check if target columns are part of a unique constraint or primary key
    target_is_unique = False
    for col in target_columns:
        if col in target_table_info["primary_keys"]:
            target_is_unique = True
            break
        
        for constraint in target_table_info.get("unique_constraints", []):
            if col in constraint["columns"] and len(constraint["columns"]) == len(target_columns):
                target_is_unique = True
                break
    
    # Determine relationship type based on uniqueness
    if source_is_unique and target_is_unique:
        return "1:1"  # one-to-one
    elif source_is_unique:
        return "M:1"  # many-to-one
    elif target_is_unique:
        return "1:M"  # one-to-many
    else:
        return "M:M"  # many-to-many