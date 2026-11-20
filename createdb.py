import sqlite3 , config
connection = sqlite3.connect(config.DATABASE_URL)
cursor = connection.cursor()

cursor.execute(""" CREATE TABLE IF NOT EXISTS stocks(
                   id INTEGER PRIMARY KEY ,
                   symbol TEXT NOT NULL UNIQUE ,
                   name text NOT NULL )""")

cursor.execute("""CREATE TABLE IF NOT EXISTS stock_price(
                id INTEGER PRIMARY KEY  ,
                Stock_id INTEGER ,
                date NOT NULL ,
                open NOT NULL ,
                high NOT NULL ,
                low NOT NULL,
                close NOT NULL,
                volume NOT NULL,
                FOREIGN KEY (stock_id) REFERENCES stocks (id),
                UNIQUE (stock_id, date))""")

connection.commit()