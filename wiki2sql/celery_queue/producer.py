from worker import consumer
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode
import threading, time

def producer():    
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()
        sqlSelect = "SELECT change_id, change_page_title FROM ChangeTable WHERE flag = 0;"
        cursor.execute(sqlSelect)
        results = cursor.fetchall()
        for result in results:
            change_id = result[0]
            change_page_title = result[1].encode("utf8")
            try:
                sqlCheck = "SELECT * FROM ChangeTable WHERE flag = %s AND change_id = %s"
                cursor.execute(sqlCheck, (1, str(change_id)))
                if cursor.fetchone() is not None:
                    pass
                else:
                    sqlSet = "UPDATE ChangeTable SET flag = %s WHERE change_id = %s"
                    cursor.execute(sqlSet, (1, str(change_id)))
                    cnx.commit()
                    # send to consumer
                    consumer.delay(change_id, change_page_title)
            except mysql.connector.Error as e:
                print e
                cnx.rollback()
                
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
    else:
        cnx.close()

def send():
    while True:
        producer()
        #time.sleep(5)

try:
    t = threading.Thread(target=send)
    t.daemon = True
    t.start()
    while True:
        if not t.is_alive():
            logger.critical(json.dumps({"message":"Autosync crashed, restarting thread."}))
            t = threading.Thread(target=send)
            t.daemon = True
            t.start()
            
except (KeyboardInterrupt, SystemExit):
    pass