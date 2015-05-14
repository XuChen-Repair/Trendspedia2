# Django common settings for cs3281 project.
import os, sys
sys.path.append(os.path.dirname(os.path.basename(__file__)))
# Django-Celery
import djcelery
djcelery.setup_loader()
from django.conf import settings

#DEBUG = True
#TEMPLATE_DEBUG = DEBUG

TCP_HOST = 'localhost'
TCP_PORT = 9999
ROOTDIR = os.path.abspath(os.path.dirname(__file__))

CACHE_BACKEND = 'locmem:///'
TEST_RUNNER = 'discover_runner.DiscoverRunner'
TEST_DISCOVER_TOP_LEVEL = os.path.dirname(os.path.dirname(__file__))

# Specify regular expressions of code blocks the coverage analyzer should
# ignore as statements (e.g. ``raise NotImplemented``).
# These statements are not figured in as part of the coverage statistics.
# This setting is optional.

'''
'''

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/Chicago'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# Additional locations of static files
print os.path.dirname(__file__)
STATICFILES_DIRS = (
    ROOTDIR + "/../static/",
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'cs3281.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'cs3281.wsgi.application'

TEMPLATE_DIRS = (
    ROOTDIR + '/../templates/',
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'social_auth',
    'wikipedia',
    'twitter',
    'rest_framework',
    'djcelery', # Celery for RabbitMQ
    'celery_queue',
    #'discover_runner', # For testing
    #'django_coverage', # For testing coverage statistics
)

AUTHENTICATION_BACKENDS = (
    'social_auth.backends.twitter.TwitterBackend',
    'social_auth.backends.contrib.weibo.WeiboBackend',
    'django.contrib.auth.backends.ModelBackend',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.static',
    'social_auth.context_processors.social_auth_by_type_backends',
)

SECRET_KEY = '9lpn$p%+c#+pemgab*0(pp&amp;!p9m7_w%7+^9)rdd&amp;pfs*ok33rw'

# Login with Django
LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/home'
LOGIN_ERROR_URL = '/login-error/'
#LOGOUT_URL = '/logout'

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1, # Default
    'disable_existing_loggers': True, # Disable default logger
    'formatters': { # Taken from Django documentation
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'jsonString': {
            'format': '%(message)s'
        },
    },
    'filters': { # Default, might create extra filter
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        },
    },
    'handlers': { # Declare handlers here, useful if write to database or file
        # Django built-in, automatically send log to admin's mail
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        # Print INFO log to the console
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        # Print to file
        'mongoDB': {
            'level': 'INFO',
            'class': 'loggers.logEntry.RequestLogEntry',
            'formatter': 'jsonString',
            'filename': 'sample.txt'
        },
        'tokens_queue': {
            'level': 'INFO',
            'class': 'loggers.logEntry.TokensQueueLogEntry',
            'formatter': 'jsonString',
        },
    },
    'loggers': { # Declare handler within {{APP_NAME}} hierachy
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'twitter.views.search_with_tokens': {
            'handlers': ['console', 'mongoDB'],
            'level': 'INFO',
        },
        'celery_queue.*': {
            'handlers': ['tokens_queue'],
            'level': 'INFO',
        },
    }
}

DEBUG = True
#DEBUG = False
TEMPLATE_DEBUG = DEBUG

#BROKER_URL = 'amqp://cs3281:cs3281@localhost:5672/cs3281'
BROKER_URL = 'amqp://guest:guest@localhost:5672/'
# CELERY_RESULT_BACKEND = 'amqp://'

#BROKER_HOST = "localhost"
#BROKER_PORT = 5672
#BROKER_USER = "cs3281"
#BROKER_PASSWORD = "cs3281"
#BROKER_VHOST = "cs3281"

SECRET_KEY = '9lpn$p%+c#+pemgab*0(pp&amp;!p9m7_w%7+^9)rdd&amp;pfs*ok33rw'

MONGO_CONNECTION = {
    'database': 'cs3281',
    'username': 'cs3281',
    'password': 'cs3281',
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
TWITTER_CONSUMER_KEY = 'OwoIIQC79NloXYuYxE8u5zvVW'
TWITTER_CONSUMER_SECRET = 'htCAZqD3d9aLhH0hxSLoexaHdSJBmWaQ1i5ulZBj9Pj7Byl82C'
WEIBO_CLIENT_KEY = '3531138456'
WEIBO_CLIENT_SECRET = 'a7337d1e716d64e72cd5bc7445c96206'

CELERY_IMPORTS = ('celery_queue.tasks', )