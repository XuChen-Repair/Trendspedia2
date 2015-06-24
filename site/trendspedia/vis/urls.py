from django.conf.urls import patterns, include, url
from django.views.generic import DetailView, ListView
from rest_framework.urlpatterns import format_suffix_patterns
import vis.views

urlpatterns = patterns('vis.views',
    url(r'^getAllPLs$', 'getAllPLs'),
    url(r'^selectNodes$', 'selectNodes')
)

urlpatterns = format_suffix_patterns(urlpatterns)