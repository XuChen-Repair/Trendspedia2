from lxml import etree
import pdb
from sql import insert

path_to_file = '../enwiki-20150515-pages-articles.xml'
context = etree.iterparse(path_to_file, events=('start','end'))
namespace = ''

dicts = {}
stack = []
for event, element in context:
	tagname = etree.QName(element.tag).localname
	if event == 'start':
		if tagname == 'page':
			dicts = {}
			dicts['page'] = {}
			dicts['revision'] = {}
			stack.append('page')
		elif tagname == 'revision':
			stack.append('revision')
		elif tagname == 'contributor':
			stack.append('contributor')
	elif event == 'end':
		if tagname == 'revision':
			stack.pop()
		elif tagname == 'contributor':
			stack.pop()
		elif tagname == 'page':
			stack.pop()
			# At this point one row each for page and revision
			# complete. Send to DB (use UTF-8 and capture errors)
			insert(dicts)
		elif len(stack) != 0 and stack[-1] in ['page','revision']:
			# This is where the actual properties get added
			# We are only interested in properties who are children of page/revision
			if(element.text):
				dicts[stack[-1]][tagname] = element.text.encode('UTF-8')
			else:
				dicts[stack[-1]][tagname] = None
		# This node is parsed. Clear memory for the next one
		# More info here:
		# https://www.ibm.com/developerworks/library/x-hiperfparse/
		element.clear()
		while element.getprevious() is not None:
			del element.getparent()[0]

