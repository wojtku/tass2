## Wymagania
+ Python3
+ Flask [pip3 install flask]
+ Flask-SQLAlchemy

## Testy
    python3 -m unittest discover -v serwer
    
## Decyzje
+ za pomocą wyrażeń regularnych szukam lokalizacji w polu *pyt* oraz *wniosek*
  
  wyrażenie regularne:
  
        (?:[uU]l\.|[uU]lic[ay]?|[Ss]kwe(?:rze|r)|[Pp]lacu?)\s?\w+(?:-?[a-zA-Z]*)(?:\s?\d{1,3}\w?)?
+ w bazie jest dodatkowe pole *lokalizacja*, które przechowuje wyekstrahowane nazwy ulic itp. oddzielonych od siebie
     znakiem `|` (w przypadkach gdy w 1 wniosku znaleziono np. kilka ulic)