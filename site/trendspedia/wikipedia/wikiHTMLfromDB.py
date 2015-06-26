import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode

def html(page_id):
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()

        flag = False
        sqlSelectPage = "SELECT page_namespace, page_revision, page_title FROM page WHERE page_id = %s"
        cursor.execute(sqlSelectPage, (page_id, ))
        row = cursor.fetchone()
        page_title = None
        text = None
        if row:
            rev_id = row[1]
            page_namespace = row[0]
            page_title = row[2]
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
            res = parse(text, page_title)
            return res.encode('utf-8')

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
def parse(text, title):
    import subprocess, codecs
    # open process
    if text is None or title is None:
        o = "<h1>Parse error</h1>"
    else:
        # text, tmp = codecs.utf_8_decode(text.encode('utf-8'))
        title, tmp = codecs.utf_8_decode(text.encode('utf-8'))
        # text = text.encode('utf-8').decode('utf-8')
        # title=title.encode('utf-8').decode('utf-8')
        p = subprocess.Popen(['php', 'Server.php', "'" + title + "'"], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
        # read output
        o = p.communicate(text.encode('utf-8'))[0]
        # kill process
        try:
            os.kill(p.pid, signal.SIGTERM)
        except:
            pass
    return o

if __name__ == "__main__":
    html(27318)
