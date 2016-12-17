import requests
from pprint import pprint

# set the request parameters
url = "http://bip.lublin.eu/api-json/ui/"

# fetch url
print("Fetching url...")

response = requests.get(url, verify=True)

# check for http codes other than 200
if response.status_code != 200:
    print('Status:', response.status_code, 'Problem with the request. Exiting.')
    exit()

# decode the JSON response into a dictionary and use the data
data = response.json()
items = data["items"][0]
pprint(items)


#TEST GITHUBA MHAPONIU