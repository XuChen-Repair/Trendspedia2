
import os, sys,json
sys.path.append(os.path.dirname(os.path.basename(__file__)))
from django.utils import unittest
from django.test.client import RequestFactory
from django.test.client import Client
from django.conf import settings
from django.core.cache import cache
import django
import views
import selenium
import helper

class HelperTester(django.test.TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()
        self.helper = helper.Helper()
        pass

    def tearDown(self):
        assert settings.CACHE_BACKEND == 'locmem:///'
        [cache.delete(key) for key in cache._cache.keys()]
        
    def test_uniqueList(self):
        a = [1, 1, 2 ,3, 4, 7, 7, 6, 6, 8]
        b = helper.uniqueList(a)
        expected = [1,2,3,4,7,6,8]
        for (i,j) in zip(b,expected):
            self.assertTrue(i==j)

    def test_jsonp(self):
        request = self.factory.get('/home')
        response = self.helper.jsonp(request,{'random_data':'random'})
        self.assertTrue(response.content, '{"random_data": "random"}')
        request = self.factory.get('/home?callback=123')
        response = self.helper.jsonp(request,{'random_data':'random'})   
        self.assertTrue(response.content, '123({"random_data": "random"});')
