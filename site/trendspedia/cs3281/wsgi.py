"""
WSGI config for twitter project.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""
import os
import site
import sys

# Where manage.py is
SITE_DIR = '/Users/shubhamgoyal/NUS/SeSaMe/Trendspedia/site/trendspedia'
site.addsitedir(SITE_DIR)
sys.path.append(SITE_DIR)

DJANGO_SETTINGS_MODULE = "settings.deployment"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", DJANGO_SETTINGS_MODULE)
print "Following Settings at", DJANGO_SETTINGS_MODULE

# This application object is used by any WSGI server configured to use this
# file. This includes Django's development server, if the WSGI_APPLICATION
# setting points here.
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Tokens Producer runs as a separate thread
from celery_queue import tokens_producer
import threading
t = threading.Thread(target=tokens_producer.run_producer)
t.daemon = True
t.start()
