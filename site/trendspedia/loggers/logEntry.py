# Standard library imports
import json
from logging import Handler

# Third party library
from mongoengine import * # MongoDB model wrapper

"""A handler for logging information taken from views in other application

It extends a basic Handler class in Python. During initialization, it will
connect to a running instance of MongoDB to store emitted message.

When it receives a record, it would expect the message property to be a
JSON string. It will be used to initialize an instance of LogEntry model,
which abstracts a log document stored in MongoDB. Read the model.py file
for details of RequestEntry model.

"""
class RequestLogEntry(Handler, object):
    _name = "" # Need for sub-classing Handler
    
    # Init, call the base class constructor.
    # Avoid calling ''settings' module to prevent circular import.
    def __init__(self, filename):
        super(RequestLogEntry, self).__init__()

    # When received emitted record, parse it and get the logging 
    # message. The message should be a JSON string.
    def emit(self, record):
        try:
            # Have to method import to avoid circular 'settings.py' import.
            # Need mongodb credentials in settings to connecto mongo instance.
            # Might affect performance.
            from loggers.mongoModels import RequestLog
            logEntry = RequestLog()
            try:
                data = json.loads(record.message)
                # Loop through the log message 
                for key,value in data.items():
                    if hasattr(logEntry, key):# save attributes meant for model
                        try:
                            setattr(logEntry, key, value)
                        except Exception: # Model does not have that attr
                            pass
            except Exception, e:
                print str(e)
            # Save if the model object is initialized successfully
            logEntry.save()
        except Exception, e:
            # Catch general errors
            print str(e)

class TokensQueueLogEntry(Handler, object):
    _name = "" # Need for sub-classing Handler
    
    # Init, call the base class constructor.
    # Avoid calling ''settings' module to prevent circular import.
    def __init__(self):
        super(TokensQueueLogEntry, self).__init__()

    # When received emitted record, parse it and get the logging 
    # message. The message should be a JSON string.
    def emit(self, record):
        try:
            # Have to method import to avoid circular 'settings.py' import.
            # Need mongodb credentials in settings to connecto mongo instance.
            # Might affect performance.
            from loggers.mongoModels import TokensQueueLog
            logEntry = TokensQueueLog()
            try:
                data = json.loads(record.message)
                # Loop through the log message 
                for key,value in data.items():
                    if hasattr(logEntry, key):# save attributes meant for model
                        try:
                            setattr(logEntry, key, value)
                        except Exception: # Model does not have that attr
                            pass
            except Exception, e:
                print str(e)
            # Save if the model object is initialized successfully
            logEntry.save()
        except Exception, e:
            # Catch general errors
            print str(e)
