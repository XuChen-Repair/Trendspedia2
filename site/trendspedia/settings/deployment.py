from common import *

#DEBUG = True
DEBUG = False
TEMPLATE_DEBUG = DEBUG

#BROKER_URL = 'amqp://cs3281:cs3281@localhost:5672/cs3281'
BROKER_URL = 'amqp://guest:guest@localhost:5672/'

#BROKER_HOST = "localhost"
#BROKER_PORT = 5672
#BROKER_USER = "cs3281"
#BROKER_PASSWORD = "cs3281"
#BROKER_VHOST = "cs3281"

MONGO_CONNECTION = {
    'database': 'cs3281',
    #'username': 'cs3281',
    #'password': 'cs3281',
}

DATABASES = { 
    'default': {
        'ENGINE': 'django.db.backends.mysql', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'cs3281',                      # Or path to database file if using sqlite3.
        'USER': 'cs3281',                      # Not used with sqlite3.
        'PASSWORD': 'cs3281',                  # Not used with sqlite3.
        'HOST': '127.0.0.1',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    },  
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/Chicago'

SOCIAL_AUTH_ENABlED_BACKENDS = ('twitter',)
SOCIAL_AUTH_DEFAULT_USERNAME = "cs3281"

# Token for OAuth services
# TWITTER_CONSUMER_KEY = 'Q7RZnEHWBluNGrFIbJxTQ'
# TWITTER_CONSUMER_SECRET = 'HtkZnLGrmliQivLRPIxOFoPVfgDc3tsB7c9UMuVeA'
TWITTER_CONSUMER_KEY = 'OwoIIQC79NloXYuYxE8u5zvVW'
TWITTER_CONSUMER_SECRET = 'htCAZqD3d9aLhH0hxSLoexaHdSJBmWaQ1i5ulZBj9Pj7Byl82C'
WEIBO_CLIENT_KEY = '3264232303'
WEIBO_CLIENT_SECRET = '06e03d61c008ab4291b39b328aa4af25'

CELERY_IMPORTS = ('celery_queue.tasks',)
