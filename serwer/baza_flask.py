import logging
import re
from collections import OrderedDict
from datetime import date

import flask
import requests
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.sqlite import DATE
import googlemaps

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///TASS.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = 'True'

db = SQLAlchemy(app)
gmaps = googlemaps.Client(key='AIzaSyAN11JmHUzcLl7Gu9aijV4ToG0-buMRrh4')

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
    latitude = db.Column(db.String, nullable=True)
    longitude = db.Column(db.String, nullable=True)

    def __init__(self, id, link, odp, wniosek, pyt, data, kom_org, lokalizacja, latitude, longitude):
        self.id = id
        self.link = link
        self.odp = odp
        self.wniosek = wniosek
        self.pyt = pyt
        self.data = data
        self.kom_org = kom_org
        self.lokalizacja = lokalizacja
        self.latitude = latitude
        self.longitude = longitude


db.create_all()


@app.route("/wnioski")
def hello():
    ret = []
    try:
        date_from = Wnioski.dateStringToDate(request.values['date_from'])
        date_to = Wnioski.dateStringToDate(request.values['date_to'])
    except Exception as e:
        return flask.jsonify({'error': e})
    query = db.session.query(TassDB).filter(TassDB.pyt != None) \
        .filter(TassDB.wniosek != None) \
        .filter(TassDB.lokalizacja != None) \
        .filter(TassDB.latitude != None) \
        .filter(TassDB.longitude != None) \
        .filter(TassDB.data > date_from, TassDB.data < date_to) \
        .filter(TassDB.id.notin_(SerwerTass.wyjatki_id)).all()
    # short_query = query[:20]
    for item in query:
        addresses = item.longitude.split("|")
        longitudes = item.longitude.split("|")
        latitudes = item.latitude.split("|")
        for address in range(len(addresses)):
            ret_item = {
                'id': item.id,
                'link': item.link,
                'odp': item.odp,
                'wniosek': item.wniosek,
                'pyt': item.pyt,
                'data': Wnioski.dateToDateString(item.data),
                'kom_org': item.kom_org,
                'lokalizacja': item.lokalizacja,
                'latitude': float(latitudes[address]),
                'longitude': float(longitudes[address])
            }
            ret.append(ret_item)
    response = flask.jsonify(ret)
    response.headers['Access-Control-Allow-Origin'] = '*'
    try:
        logging.info('response %d lokalizacji' % len(ret))
    except Exception as e:
        pass
    return response


class Wnioski():
    def __init__(self):
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


class SerwerTass():
    wyjatki_id = [245104, 246830, 247873, 248264, 248299, 248564, 251245, 251926, 252119, 253536, 253640, 254257,
                  255597, 255601, 257238, 258381, 258737, 258754, 259371, 259810, 262545, 262846, 265255, 265337,
                  267014, 268584, 268706, 268880, 268884, 268944, 269183, 269189, 269260, 269995, 270263, 270449,
                  270453, 272148, 272765, 272831, 272834, 273751, 273771, 274704]  # inty id

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
            print('aby ją wczytać ponownie usun plik bazy serwer/TASS.db')

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
                'lokalizacja': None,
                'latitude': None,
                'longitude': None
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
            .filter(TassDB.wniosek != None) \
            .filter(TassDB.id.notin_(self.wyjatki_id)).all()
        # TODO zmienic na cale query, usunac linijke nizej
        # query = query[:20]
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
                for address in lokalizacja.split("|"):
                    geocode_result = gmaps.geocode("Lublin, " + address)
                    try:
                        lat = geocode_result[0]['geometry']['location']['lat']
                        lng = geocode_result[0]['geometry']['location']['lng']
                    except IndexError as error:
                        logging.debug('google api nie znalazlo lokalizacji: %s', address)
                        continue
                    item.latitude = SerwerTass._dopisz_albo_utworz_stringa(cel=item.latitude, text=lat)
                    item.longitude = SerwerTass._dopisz_albo_utworz_stringa(cel=item.longitude, text=lng)
            else:
                # logging.debug('nie znaleziono wzorca')
                pass

            global_finded.extend(finded)

        logging.debug('wszystkich lokacji w bazie: %d', len(global_finded))
        self.db.session.commit()

    @staticmethod
    def _dopisz_albo_utworz_stringa(cel, text, separator='|'):
        if cel == None:
            return str(text)
        else:
            return (separator).join([cel, str(text)])



    def _czysc_lokalizacje(self):
        logging.debug('czyszcze dane lokalizacyjne')
        for item in self.db.session.query(TassDB).all():
            item.lokalizacja = None
            item.latitude = None
            item.longitude = None
        self.db.session.commit()


class Regex():
    def __init__(self):
        dia_male = "&;śżźćłóęą"
        dia_duze = "&;ŚŻŹĆŁÓĘĄ"
        # dia_m_d = dia_male + dia_duze
        regex_zakazane = r'(?!(?:pod|lub|albo|ówki|oraz|zabaw|znych))'
        regex_przedrostek = r'al\.|alej(?:ach|[eai])|[uU]l\.|[uU]lic(?:[eay]|ach)?|[Ss]kwe(?:rze|r)|[Pp]lacu?'
        regex_cialo = r'\s?' + regex_zakazane + '\w{4,}(?:-?[a-zśżźćłóęąA-ZŚŻŹĆŁÓĘĄ]*)(?:\s[A-ZŚŻŹĆŁÓĘĄ]\w{2,})?(?:\s?\d{1,3}\w?)?'
        regex_string = r'(?:' + regex_przedrostek + ')' + regex_cialo
        logging.debug('regex: %s' % regex_string)

        self.patt_sam_przedrostek = re.compile(r"^(?:" + regex_przedrostek + r")\s*$", re.IGNORECASE)
        self.patt_przedrostek = re.compile(r"^(?:" + regex_przedrostek + r")\s*", re.IGNORECASE)
        self.patt = re.compile(regex_string)

    def string_lokalizacyjny(self, lista_regex):
        ret = self._usun_duplikaty(lista_regex)
        self._usun_gdy_sam_przedrostek(ret)
        # ret = self._usun_o_tych_samych_cialach(ret)
        return '|'.join(ret)  # odzielam kilka lokalizacji |

    def _usun_duplikaty(self, lista_regex):
        return list(set(lista_regex))

    def _usun_o_tych_samych_cialach(self, lista_regex):
        # TODO cos slabo to dziala
        ret_list = []
        if len(lista_regex) == 1:
            return lista_regex
        for l in lista_regex:
            ret_list.append(self._utnij_przedrostek(l))
        return list(set(ret_list))

    def _usun_podobne(self):
        # TODO wybierz te dluzsze gdzie rozny 'startwith' w ciele
        pass

    def _usun_gdy_sam_przedrostek(self, lista_regex):
        for r in lista_regex:
            if self._dopasowany_sam_przedrostek(r):
                lista_regex.remove(r)

    def szukaj(self, text):
        return re.findall(self.patt, text)

    def _dopasowany_sam_przedrostek(self, text):
        if self.patt_sam_przedrostek.match(text) is not None:
            return True
        else:
            return False

    def _utnij_przedrostek(self, text):
        przedrostek = self.patt_przedrostek.match(text).group()
        return text.strip(przedrostek)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')
    # logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

    serv = SerwerTass(db, app)
    # serv._czysc_lokalizacje()
    # serv.regexuj_lokalizacje()
    serv.run()
    print('koniec')


    # app.debug = True
    # app.run()
