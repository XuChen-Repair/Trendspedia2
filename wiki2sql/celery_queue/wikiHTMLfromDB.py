from workerForPagelinks import consumer
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode

def html(page_title):
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()

        flag = False
        sqlSelectPage = "SELECT page_namespace, page_revision FROM page WHERE page_title = %s"
        cursor.execute(sqlSelectPage, (page_title, ))
        row = cursor.fetchone()        
        if row:
            rev_id = row[1]
            page_namespace = row[0]
            sqlSelectPage = "SELECT rev_text_id FROM revision WHERE rev_id = %s"
            cursor.execute(sqlSelectPage, (rev_id, ))
            row = cursor.fetchone()
            if row:                
                text_id = row[0]
                sqlSelectText = "SELECT text_text FROM text WHERE text_id = %s"
                cursor.execute(sqlSelectText, (text_id, ))
                row = cursor.fetchone()
                if row:
                    text = row[0]
                    text = text.decode("utf8")
                    flag = True

        if not flag:
            return "Wikipedia page not found in Trendspedia database."
        else:

            # mediawiki-parser

            # templates = {'Template': 10, 'Category': 14, 'File': 6}
            # allowed_tags = []
            # allowed_self_closing_tags = []
            # allowed_attributes = []
            # interwiki = {'en': 'http://trendspedia.com/home/en/?title='}
            # namespaces = {}

            # from mediawiki_parser.preprocessor import make_parser
            # preprocessor = make_parser(templates)

            # from mediawiki_parser.html import make_parser
            # parser = make_parser(allowed_tags, allowed_self_closing_tags, allowed_attributes, interwiki, namespaces)

            # preprocessed_text = preprocessor.parse(text)
            # tree = parser.parse(preprocessed_text.leaves())

            # output = """<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><meta name="type" content="text/html; charset=utf-8" /></head>""" + tree.leaves() + "</html>"
            # output = "".join(output.split("\n"))

            # return output.encode('utf8')

            # code = """<?php
            #     include('Parser.php');
            #     echo Parser::parse(""" + "\"" + text + "\"" + """);
            # ?>
            # """
            #print code

            code = """<?php
                include('test.php');
                echo test("Hello");
            ?>
            """

            res = php(code)
            return res.encode('utf8')

    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
    else:
        cnx.close()

# shell execute PHP
def php(code):
    import subprocess
    # open process
    p = subprocess.Popen(['test.php'], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
    # read output
    o = p.communicate(code)[0]
    # kill process
    try:
        os.kill(p.pid, signal.SIGTERM)
    except:
        pass
    return o
