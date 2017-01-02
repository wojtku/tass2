import requests
from collections import OrderedDict
from datetime import date


class Wnioski():
    def __init__(self, db):
        self.main_url = 'http://bip.lublin.eu/api-json/ui/all'
        self.db = db

    def pobierz(self, od, ile):
        # 0 jest zawsze najnowszym wnioskiem
        url = "/".join([self.main_url, str(od), str(ile)]) + '/'
        response = requests.get(url)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response.json()['items']

    def pobierz_wszystko(self):
        limit = 100
        count = self.__ile_wszystkich_wnioskow()
        d = OrderedDict()
        for n in range(0, count, limit):
            for item in self.pobierz(od=n, ile=limit):
                d[item['id']] = item
        return d

    def __ile_wszystkich_wnioskow(self):
        return int(requests.get(self.main_url + '/').json()['count'])

    @staticmethod
    def dateStringToDate(datestring_dmy):
        lista = datestring_dmy.split('-')
        return date(year=int(lista[2]), month=int(lista[1]), day=int(lista[0]))

    @staticmethod
    def dateToDateString(date):
        return '-'.join([str(date.day), str(date.month), str(date.year)])
