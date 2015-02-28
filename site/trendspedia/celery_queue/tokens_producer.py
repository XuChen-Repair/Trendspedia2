import os, sys, inspect
cmd_folder = os.path.dirname(os.path.realpath(os.path.abspath(os.path.split(inspect.getfile( inspect.currentframe() ))[0])))
if cmd_folder not in sys.path:
    sys.path.insert(0, cmd_folder) 
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.development")

from django.conf import settings
from celery_queue import tokens_queue
import pika
import json, threading
import logging, datetime, time

#
# Create a custom logger to provide a rotating logfile system.
# Format msgs with datetime strings, loglevel, and message string
# Takes a log name (str) as input. Returns a logger object.
# You write to logger objects in the following way:
# my_logger.info('This is just a test')
#

def createLogger(logName, consoleHandlerPropagate):	
    #
    # Create logger
    #
    
    my_logger = logging.getLogger(logName)
    my_logger.setLevel(logging.DEBUG)
    my_logger.propagate = False

    # Create directory

    if not os.path.exists(sys.path[0] + "/log/"):
        os.makedirs(sys.path[0] + "/log/")

    #
    # Add the logfile message handler to the logger 
    #

    fileHandler = logging.handlers.RotatingFileHandler(
            sys.path[0] + "/log/" + logName + ".txt", maxBytes=102400000, backupCount=5)
    # hdlr = logging.FileHandler(sys.path[0] + "/logs/" + logName + ".txt")

    consoleHandler = logging.StreamHandler()

            
    FORMAT='%(asctime)s\t%(levelname)s\t%(message)s'

    formatter = logging.Formatter(FORMAT) # Formatter object
    fileHandler.setFormatter(formatter) # Apply format to the file
    consoleHandler.setFormatter(formatter) # Apply format to stdout
    
    my_logger.addHandler(fileHandler)
    if consoleHandlerPropagate:
        my_logger.addHandler(consoleHandler)
    # my_logger.addHandler(hdlr)

    #consoleHandler.propagate = consoleHandlerPropagate
    my_logger.propagate = False
    
    return my_logger

def producer(logger):
    tq = tokens_queue.TokensQueue(logger)

    # Receive token requests
    connection = pika.BlockingConnection(pika.ConnectionParameters(
            host='localhost'))
    channel = connection.channel()

    channel.queue_declare(queue='tokens_queue')

    def callback(ch, method, properties, body):
        # body represents the queryType
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host='localhost'))
        channel = connection.channel()
        channel.queue_declare(queue=body)
        channel.basic_publish(exchange='',
                          routing_key=body,
                          body=json.dumps(tq.retrieveToken(body)))
        connection.close()

    channel.basic_consume(callback,
                          queue='tokens_queue',
                          no_ack=True)

    channel.start_consuming()


def run_producer():
    try:
##        logger = logging.getLogger(__name__)
        logger = createLogger("tokens_producer", True)
        logger.info(json.dumps({"message":"Tokens Producer started."}))
        print "**************************************************"
        t = threading.Thread(target=producer, args=(logger,))
        t.daemon = True
        t.start()
        while True:
            if not t.is_alive():
                t = threading.Thread(target=producer, args=(logger,))
                t.daemon = True
                logger.critical(json.dumps({"message":"Tokens Producer crashed, restarting thread."}))
                t.start()
            # Sleep for 30 seconds
            time.sleep(30)
    except (KeyboardInterrupt, SystemExit):
        sys.exit()

