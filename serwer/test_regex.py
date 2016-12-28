import unittest
import re

from tass2.serwer.baza_flask import Regex


class Regex_test(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        regex = Regex()
        cls.pattern = regex.pattern()

    def porownaj(self, text, przewidywany_wynik):
        self.assertEqual(self.pattern.findall(text), przewidywany_wynik)

    def test_ul_1(self):
        self.porownaj('ul.mazurka32', ['ul.mazurka32'])

    def test_ul_2(self):
        self.porownaj('ul.mazurka 32', ['ul.mazurka 32'])

    def test_ul_3(self):
        self.porownaj('ul. mazurka 32', ['ul. mazurka 32'])

    def test_ul_4(self):
        self.porownaj('Ul.mazurka 32', ['Ul.mazurka 32'])

    def test_ul_5(self):
        self.porownaj('ul.Mazurka 32', ['ul.Mazurka 32'])

    def test_ul_6(self):
        self.porownaj('ul.Kazimierza-Wielkiego 32', ['ul.Kazimierza-Wielkiego 32'])

    def test_ul_7(self):
        self.porownaj('ul.Kazimierza-Wielkiego', ['ul.Kazimierza-Wielkiego'])

    def test_ul_8(self):
        self.porownaj('abcabc ul.Kazimierza-Wielkiego', ['ul.Kazimierza-Wielkiego'])

    def test_ul_9(self):
        self.porownaj('abc abc ul.Kazimierza-Wielkiego 32 abc abc', ['ul.Kazimierza-Wielkiego 32'])

    def test_ul_10(self):
        self.porownaj('abc abc ul.Kazimierza-Wielkiego 32A abc abc', ['ul.Kazimierza-Wielkiego 32A'])

    def test_ul_11(self):
        self.porownaj('abc abc ul.Kazimierza-Wielkiego 32 abc abc', ['ul.Kazimierza-Wielkiego 32'])

    def test_ul_12(self):
        self.porownaj('abc abc ul.Kazimierza-Wielkiego32 abc abc', ['ul.Kazimierza-Wielkiego32'])

    def test_ul_13(self):
        self.porownaj('abc abc ul.Kazimierza-Wielkiego32A abc abc', ['ul.Kazimierza-Wielkiego32A'])

    def test_ul_14(self):
        self.porownaj('abcabc ul.Kazimierza-Wielkiego abc abc', ['ul.Kazimierza-Wielkiego'])

    def test_ulica_1(self):
        self.porownaj('ulica jana 32', ['ulica jana 32'])

    def test_ulica_2(self):
        self.porownaj('Ulica jana 32', ['Ulica jana 32'])

    def test_ulica_3(self):
        self.porownaj('przy ulicy jana 32', ['ulicy jana 32'])

    def test_skwer_1(self):
        self.porownaj('skwer jana 32', ['skwer jana 32'])

    def test_skwer_2(self):
        self.porownaj('przy skwerze jana 32', ['skwerze jana 32'])

    def test_plac_1(self):
        self.porownaj('plac jana 32', ['plac jana 32'])

    def test_plac_2(self):
        self.porownaj('przy placu jana 32', ['placu jana 32'])

    def test_aleje_1(self):
        self.porownaj('al. jana 32', ['al. jana 32'])

    def test_aleje_2(self):
        self.porownaj('aleje jana 32', ['aleje jana 32'])

    def test_aleje_3(self):
        self.porownaj('alejach jana 32', ['alejach jana 32'])

    def test_aleje_4(self):
        self.porownaj('aleji jana 32', ['aleji jana 32'])

    def test_aleje_5(self):
        self.porownaj('aleja jana 32', ['aleja jana 32'])

    def test_multi_1(self):
        self.porownaj('abc abc ul.jana 88 adfab plac Pawła 32 abcabc', ['ul.jana 88', 'plac Pawła 32'])

    def test_multi_2(self):
        self.porownaj('abc abc ul.jana 88 adfab przy placu Pawła abcabc', ['ul.jana 88', 'placu Pawła'])