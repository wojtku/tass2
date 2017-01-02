## Wymagania
+ Python3.5
+ Flask [pip3 install flask]
+ Flask-SQLAlchemy
+ requests [pip3 isntall requests]
+ Googlemaps [pip3 install -U googlemaps] (do geokodowania adresów)

## Instrukcje

##### Uruchomienie serwera
    python3.5 serwer/baza_flask.py

##### Uruchomienie aplikacji lokalnie
    Po uruchomieniu serwera uruchomić plik map.html w dowolnej przeglądarce
    
##### Testy
    python3.5 -m unittest discover -v serwer
    
##### Zapytanie
zwraca wnioski z zadanego zakresu czasowego w postaci JSON  
jest to lista słowników z kluczami [id, data, lokalizacja itd.]
pola daty *data_from* i *data_to* w formacie *DD-MM-RRRR*

    http://127.0.0.1:5000/wnioski?date_from=21-01-2010&date_to=21-05-2017

przykład zapytania (wszystkie wnioski) jest zrzucony do pliku serwer/wnioski.json (jakbyś nie chciał uruchamiać całego serwera)

##### Budowanie bazy
cała baza danych buduje sie do pliku serwer/TASS.db podczas pierwszego uruchomienia serwera  
żeby zbudowac od nowa, należy go usunąć.
    
## Decyzje
+ za pomocą wyrażeń regularnych szukam lokalizacji w polu *pyt* oraz *wniosek*
  
  wyrażenie regularne:
  
        (?:al\.|alej(?:ach|[eai])|[uU]l\.|[uU]lic(?:[eay]|ach)?|[Ss]kwe(?:rze|r)|[Pp]lacu?)\s?(?!(?:pod|lub|albo|ówki))\w{3,}(?:-?[a-zśżźćłóęąA-ZŚŻŹĆŁÓĘĄ]*)(?:\s[A-ZŚŻŹĆŁÓĘĄ]\w{2,})?(?:\s?\d{1,3}\w?)?
+ w bazie jest dodatkowe pole *lokalizacja*, które przechowuje wyekstrahowane nazwy ulic itp. oddzielonych od siebie
     znakiem `|` (w przypadkach gdy w 1 wniosku znaleziono np. kilka ulic)