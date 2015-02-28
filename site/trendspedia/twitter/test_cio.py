import os, sys
sys.path.append(os.path.dirname(os.path.basename(__file__)))
from django.test import LiveServerTestCase
from django.conf import settings
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException

#Refer to http://selenium-python.readthedocs.org/en/latest/api.html for API
#Refer to http://docs.python.org/2/library/unittest.html for unittest 

class PythonOrgSearch(LiveServerTestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1024, 768)

        #Twitter dummy account
        self.username = "cio_test"
        self.password = "CIOtest123"

        #Links for CIO page
        self.url_HomePage = "%s%s" % (self.live_server_url, "/home")

    #This will be testing the Home page
    def test_HomePage(self):
        driver = self.driver
        driver.get(self.url_HomePage)
        self.assertIn("login", driver.title)


    #This will be testing logging in with Twitter
    def test_TwitterLogin(self):
        driver = self.driver
        driver.get(self.url_HomePage)
        self.assertIn("login", driver.title)
        elem = driver.find_element_by_xpath("//a[@class=\"btn btn-primary btn-large\"]")
        elem.click()
        self.assertIn("Twitter / Authorize an application", driver.title)
        elem_username = driver.find_element_by_id("username_or_email")
        elem_username.send_keys(self.username)
        elem_password = driver.find_element_by_id("password")
        elem_password.send_keys(self.password)
        driver.find_element_by_id("allow").click()
        time.sleep(5)
        self.assertIn("home", driver.title)

    def test_Logout(self):
        self.test_TwitterLogin()
        driver = self.driver
        driver.get(self.url_HomePage)
        driver.find_element_by_id("dLabel").click()
        time.sleep(0.5)
        elem = driver.find_element_by_xpath("//a[@id=\"logout\"]").click()
        time.sleep(5)
        self.assertIn("login", driver.title)

    #This will testing the main page after logging in
    def test_MainPage(self):
        self.test_TwitterLogin()
        driver = self.driver
        driver.get(self.url_HomePage)
        try:
            driver.find_element_by_xpath("//a[contains(@href,'#tab1')]")
        except NoSuchElementException:
            assert 0, "Did not return correct search result"

    #This will be testing CIO search
    def test_Search(self):
        self.test_TwitterLogin()
        driver = self.driver
        driver.get(self.url_HomePage)
        elem = driver.find_element_by_xpath("//input[@class=\"search-query span2\"]")
        elem.send_keys("Singapore")
        elem.send_keys(Keys.RETURN)
        time.sleep(5)
        try:
            driver.find_element_by_xpath("//a[contains(@href,'/home/en/?title=Singapore')]")
        except NoSuchElementException:
            assert 0, "Did not return correct search result"


    #This will end the test suite
    def tearDown(self):
        self.driver.close()
