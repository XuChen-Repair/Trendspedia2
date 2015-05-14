from development import *

#DEBUG = True
DEBUG = TEMPLATE_DEBUG = False

#BROKER_URL = 'amqp://cs3281:cs3281@localhost:5672/cs3281'
BROKER_URL = 'amqp://guest:guest@localhost:5672/'

MONGO_CONNECTION = {
    'database': 'cs3281',
}

ALLOWED_HOSTS = ['*']
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

COVERAGE_CODE_EXCLUDES = getattr(settings, 'COVERAGE_CODE_EXCLUDES',[
                                    'def __unicode__\(self\):',
                                    'def get_absolute_url\(self\):',
                                    'def dummy.*(.*):',
                                    'from .* import .*', 'import .*',
                                    'def .*:.*TEST-IGNORE',
                                    'def __new__.*:',
                                    'def log.*:',
                                    'except .*:',
                                 ])

# Specify a list of regular expressions of paths to exclude from
# coverage analysis.
# Note these paths are ignored by the module introspection tool and take
# precedence over any package/module settings such as:
# TODO: THE SETTING FOR MODULES
# Use this to exclude subdirectories like ``r'.svn'``, for example.
# This setting is optional.
COVERAGE_PATH_EXCLUDES = getattr(settings, 'COVERAGE_PATH_EXCLUDES',
                                 [r'.svn'])

# Specify a list of additional module paths to include
# in the coverage analysis. By default, only modules within installed
# apps are reported. If you have utility modules outside of the app
# structure, you can include them here.
# Note this list is *NOT* regular expression, so you have to be explicit,
# such as 'myproject.utils', and not 'utils$'.
# This setting is optional.
COVERAGE_ADDITIONAL_MODULES = getattr(settings, 'COVERAGE_ADDITIONAL_MODULES', [])

# Specify a list of regular expressions of module paths to exclude
# from the coverage analysis. Examples are ``'tests$'`` and ``'urls$'``.
# This setting is optional.
COVERAGE_MODULE_EXCLUDES = getattr(settings, 'COVERAGE_MODULE_EXCLUDES',
                                   ['__init__','djcelery','rest_framework',
                                    '^django','test.*','tokens_producer$',
                                    'tasks$',])


# Specify the directory where you would like the coverage report to create
# the HTML files.
# You'll need to make sure this directory exists and is writable by the
# user account running the test.
# You should probably set this one explicitly in your own settings file.

#COVERAGE_REPORT_HTML_OUTPUT_DIR = '/my_home/test_html'
COVERAGE_REPORT_HTML_OUTPUT_DIR = getattr(settings,
                                          'COVERAGE_REPORT_HTML_OUTPUT_DIR',
                                          None)

# True => html reports by 55minutes
# False => html reports by coverage.py
COVERAGE_CUSTOM_REPORTS = getattr(settings, 'COVERAGE_CUSTOM_REPORTS', True)

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.

SOCIAL_AUTH_ENABlED_BACKENDS = ('twitter',)
SOCIAL_AUTH_DEFAULT_USERNAME = "cs3281"

TIME_ZONE = 'America/Chicago'
# Token for OAuth services
TWITTER_CONSUMER_KEY = 'OwoIIQC79NloXYuYxE8u5zvVW'
TWITTER_CONSUMER_SECRET = 'htCAZqD3d9aLhH0hxSLoexaHdSJBmWaQ1i5ulZBj9Pj7Byl82C'
WEIBO_CLIENT_KEY = '3264232303'
WEIBO_CLIENT_SECRET = '06e03d61c008ab4291b39b328aa4af25'

CELERY_IMPORTS = ('celery_queue.tasks', )
