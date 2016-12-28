import logging
import re
from collections import OrderedDict
from datetime import date

import flask
import requests
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.sqlite import DATE

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///TASS.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'True'

db = SQLAlchemy(app)


class TassDB(db.Model):
    __tablename__ = 'wnioski'
    id = db.Column(db.Integer, primary_key=True)
    link = db.Column(db.String, nullable=True)
    odp = db.Column(db.String, nullable=True)
    wniosek = db.Column(db.String, nullable=False)
    pyt = db.Column(db.String, nullable=True)
    data = db.Column(DATE, nullable=True)
    kom_org = db.Column(db.String, nullable=True)
    lokalizacja = db.Column(db.String, nullable=True)

    def __init__(self, id, link, odp, wniosek, pyt, data, kom_org, lokalizacja):
        self.id = id
        self.link = link
        self.odp = odp
        self.wniosek = wniosek
        self.pyt = pyt
        self.data = data
        self.kom_org = kom_org
        self.lokalizacja = lokalizacja


db.create_all()


@app.route("/hello")
def hello():
    ret = {}
    ret['hello'] = 'word'
    ret['witaj'] = 'swiecie'
    return flask.jsonify(ret)


class Wnioski():
    def __init__(self):
        self.main_url = 'http://bip.lublin.eu/api-json/ui/all'
        self.db = db

    def pobierz(self, od, ile):
        # 0 jest zawsze najnowszym wnioskiem
        url = "/".join([self.main_url, str(od), str(ile)]) + '/'
        response = requests.get(url)
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
        return '-'.join([date.day, date.month, date.year])


class SerwerTass():
    def __init__(self, db, app):
        self.wnioski = Wnioski()
        self.db = db
        self.app = app
        self.regex = Regex()

        if self.db.session.query(TassDB).all() == []:
            print('baza pusta, wczytuje dane')
            self.inicjuj_baze()
            print('dane wczytane')
        else:
            print('baza została już wcześniej utworzona')

    def inicjuj_baze(self):
        wnioski = self.wnioski.pobierz_wszystko()
        wnioski_do_bazy = []
        for id_wniosku in wnioski:
            new = {
                'id': None,
                'link': None,
                'odp': None,
                'wniosek': None,
                'pyt': None,
                'data': None,
                'kom_org': None,
                'lokalizacja': None
            }
            for key in new.keys():
                try:
                    if key == 'data':
                        new[key] = self.wnioski.dateStringToDate(wnioski[id_wniosku][key])
                    else:
                        new[key] = wnioski[id_wniosku][key]
                except KeyError:
                    logging.debug('KeyError ale lecimy dalej')
            item = TassDB(**new)
            wnioski_do_bazy.append(item)
        self.db.session.add_all(wnioski_do_bazy)
        self.db.session.commit()

    def run(self):
        self.app.run()

    def regexuj_lokalizacje(self):
        global_finded = []
        query = self.db.session.query(TassDB).filter(TassDB.pyt != None) \
            .filter(TassDB.wniosek != None).all()
        logging.debug('len query: %d' % len(query))
        for item in query:
            finded_pyt = self.regex.szukaj(item.pyt)
            finded_wniosek = self.regex.szukaj(item.wniosek)
            finded = finded_pyt + finded_wniosek
            # logging.debug("finded regex w pyt: %d" % len(finded_pyt))
            # logging.debug("finded regex w wniosek: %d" % len(finded_wniosek))
            # logging.debug('łącznie finded: %d' % len(finded))
            lokalizacja = self.regex.string_lokalizacyjny(finded)
            if lokalizacja is not "":
                item.lokalizacja = lokalizacja
            else:
                logging.debug('nie znaleziono wzorca')

            global_finded.extend(finded)

        logging.debug('wszystkich lokacji w bazie: %d', len(global_finded))
        self.db.session.commit()

    def _czysc_lokalizacje(self):
        for item in self.db.session.query(TassDB).all():
            item.lokalizacja = None
        self.db.session.commit()


class Regex():
    def __init__(self):
        regex_string = r'(?:al\.|alej(?:e|ach|a|i)|[uU]l\.|[uU]lic[ay]?|[Ss]kwe(?:rze|r)|[Pp]lacu?\s)\s?\w+(?:-?[a-zA-Z]*)(?:\s?\d{1,3}\w?)?'
        self.patt = re.compile(regex_string, re.IGNORECASE)

    def pattern(self):
        return self.patt

    def string_lokalizacyjny(self, lista_regex):
        ret = list(set(lista_regex))  # usuwam duplikaty
        return '|'.join(ret)  # odzielam kilka lokalizacji |

    def szukaj(self, text):
        return re.findall(self.patt, text)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

    serv = SerwerTass(db, app)
    serv._czysc_lokalizacje()
    serv.regexuj_lokalizacje()
    # serv.run()
    print('koniec')


    # app.debug = True
    # app.run()
