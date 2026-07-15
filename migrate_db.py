"""
Migrate Railway PostgreSQL -> Supabase PostgreSQL
"""
import psycopg2
from psycopg2 import sql

SRC_URL = "postgresql://postgres:KzLOSiXgoiRitPeZAbyJnMTMexBqpVId@tokaido.proxy.rlwy.net:15583/railway"
DST_URL = "postgresql://postgres:28659265An$@db.kojuiugfdhspdblfcmvm.supabase.co:5432/postgres"

def strip_seq_default(default):
    """Convert DEFAULT nextval('xxx_id_seq'...) to None so we use SERIAL instead"""
    if default and "nextval" in default:
        return None
    return default

def main():
    print("Conectando a Railway...")
    src = psycopg2.connect(SRC_URL)
    src.autocommit = True
    src_cur = src.cursor()

    print("Conectando a Supabase...")
    dst = psycopg2.connect(DST_URL)
    dst.autocommit = True
    dst_cur = dst.cursor()

    # Get tables
    src_cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    tables = [row[0] for row in src_cur.fetchall()]
    print("Tablas:", ", ".join(tables))

    for table in tables:
        print(f"\n--- {table} ---")

        # Get columns
        src_cur.execute("""
            SELECT column_name, data_type, character_maximum_length,
                   is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, [table])
        columns = src_cur.fetchall()

        # Check if id column uses sequence -> use SERIAL
        col_defs = []
        id_is_serial = False
        for col in columns:
            col_name, data_type, char_max, nullable, default = col
            if col_name == "id" and default and "nextval" in default:
                col_defs.append("  id SERIAL PRIMARY KEY")
                id_is_serial = True
                continue

            pg_type = data_type
            if char_max:
                pg_type = f"{data_type}({char_max})"

            col_def = f"  {col_name} {pg_type}"
            stripped = strip_seq_default(default)
            if stripped:
                col_def += f" DEFAULT {stripped}"
            if nullable == "NO":
                col_def += " NOT NULL"
            col_defs.append(col_def)

        if not id_is_serial:
            # Add PRIMARY KEY if it's not already handled
            pass

        # Drop and recreate
        dst_cur.execute(sql.SQL("DROP TABLE IF EXISTS {} CASCADE").format(sql.Identifier(table)))

        create_sql = f"CREATE TABLE {table} (\n" + ",\n".join(col_defs) + "\n);"
        try:
            dst_cur.execute(create_sql)
            print("  Tabla creada OK")
        except Exception as e:
            print(f"  ERROR: {e}")
            print(f"  SQL: {create_sql[:200]}")
            continue

        # Copy data
        src_cur.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(table)))
        rows = src_cur.fetchall()
        print(f"  Filas: {len(rows)}")

        if not rows:
            continue

        col_names = [col[0] for col in columns]
        placeholders = sql.SQL(", ").join(sql.Placeholder() for _ in col_names)
        insert_cols = sql.SQL(", ").join(sql.Identifier(c) for c in col_names)
        insert_sql = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(table), insert_cols, placeholders
        )

        batch_size = 50
        ok = 0
        err = 0
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]
            try:
                dst_cur.executemany(insert_sql, batch)
                ok += len(batch)
            except Exception:
                for row in batch:
                    try:
                        dst_cur.execute(insert_sql, row)
                        ok += 1
                    except:
                        err += 1
        print(f"  OK: {ok} | Errores: {err}")

    # Update sequences to max id
    print("\n--- Ajustando secuencias ---")
    for table in tables:
        try:
            dst_cur.execute(sql.SQL("""
                SELECT setval('{}_id_seq', COALESCE((SELECT MAX(id) FROM {}), 0) + 1)
            """).format(sql.Identifier(f"{table}_id_seq"), sql.Identifier(table)))
            print(f"  {table}_id_seq OK")
        except Exception as e:
            print(f"  {table}_id_seq: {e}")

    # Copy indexes (non-primary, non-unique from serial)
    print("\n--- Indexes ---")
    src_cur.execute("""
        SELECT indexdef FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
          AND indexname NOT LIKE '%_id_seq%'
        ORDER BY tablename, indexname
    """)
    for (idx_def,) in src_cur.fetchall():
        try:
            dst_cur.execute(idx_def)
            print(f"  OK: {idx_def[:70]}...")
        except Exception as e:
            print(f"  {e}")

    src_cur.close()
    src.close()
    dst_cur.close()
    dst.close()
    print("\nMIGRACION COMPLETADA")

if __name__ == "__main__":
    main()

