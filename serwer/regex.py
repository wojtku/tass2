import re, logging


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
