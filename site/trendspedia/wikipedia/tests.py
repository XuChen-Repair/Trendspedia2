"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

import django
from django.test.client import RequestFactory
from django.test.client import Client
from django.core.cache import cache
from django.conf import settings
import json

class WikipediaTest(django.test.TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()
        self.client = Client()

    def tearDown(self):
        assert settings.CACHE_BACKEND == 'locmem:///'
        [cache.delete(key) for key in cache._cache.keys()]
        
    def test_getWiki(self):
        response = self.client.get('/getWiki/en/')
        jsonObj = json.loads(response.content)
        self.assertEqual(jsonObj["pageID"], "15580374")
        self.assertEqual(jsonObj["title"], "Main Page")
        self.assertTrue(jsonObj["text"].find(jsonObj["pageID"]) != -1)
        self.assertEqual(response.status_code, 200)
        
        response = self.client.get('/getWiki/zh/')
        self.assertEqual(response.status_code, 200)
        jsonObj = json.loads(response.content)
        self.assertEqual(jsonObj["pageID"], "2056")
        self.assertEqual(jsonObj["title"], "Main Page")

    def test_getSearchResult(self):
        response = self.client.get('/getSearchResult/en/', {"query":"Singapore"})
        self.assertEqual(response.status_code, 200)
        jsonObj = json.loads(response.content)
        self.assertEqual(jsonObj["status"], "OK")
        # Verify it is indeed search results from the chinese site
        self.assertTrue(response.content.find("/home/en") != -1)
        
        response = self.client.get('/getSearchResult/zh/', {"query":"S.H.E"})
        self.assertEqual(response.status_code, 200)
        jsonObj = json.loads(response.content)
        self.assertEqual(jsonObj["status"], "OK")
        # Verify it is indeed search results from the chinese site
        self.assertTrue(response.content.find("/home/zh") != -1)

