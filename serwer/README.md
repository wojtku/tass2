## Wymagania
+ Python3
+ Flask [pip3 install flask]
+ Flask-SQLAlchemy

## Instrukcje

##### Uruchomienie serwera
    python3 serwer/baza_flask.py
    
##### Testy
    python3 -m unittest discover -v serwer
    
##### Zapytanie
zwraca wnioski z całego zakresu czasowego w postaci JSON (do zmiany)
jest to lista słowników z kluczami [id, data, lokalizacja itd.]

    http://127.0.0.1:5000/wnioski

przykład zapytania jest zrzucony do pliku serwer/wnioski.json (jakbyś nie chciał uruchamiać całego serwera)

##### Budowanie bazy
cała baza danych buduje sie do pliku serwer/TASS.db podczas pierwszego uruchomienia serwera  
żeby zbudowac od nowa, należy go usunąć.
    
## Decyzje
+ za pomocą wyrażeń regularnych szukam lokalizacji w polu *pyt* oraz *wniosek*
  
  wyrażenie regularne:
  
        (?:al\.|alej(?:ach|[eai])|[uU]l\.|[uU]lic(?:[eay]|ach)?|[Ss]kwe(?:rze|r)|[Pp]lacu?)\s?(?!(?:pod|lub|albo|ówki))\w{3,}(?:-?[a-zśżźćłóęąA-ZŚŻŹĆŁÓĘĄ]*)(?:\s[A-ZŚŻŹĆŁÓĘĄ]\w{2,})?(?:\s?\d{1,3}\w?)?
+ w bazie jest dodatkowe pole *lokalizacja*, które przechowuje wyekstrahowane nazwy ulic itp. oddzielonych od siebie
     znakiem `|` (w przypadkach gdy w 1 wniosku znaleziono np. kilka ulic)