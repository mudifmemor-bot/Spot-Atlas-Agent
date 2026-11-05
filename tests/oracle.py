"""Regenerate the judge rehearsal cases from the original CSVs, independently of the app.

Run python tests/oracle.py from any directory. This oracle has no app dependencies.
"""
import csv
import json
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


TESTS = Path(__file__).resolve().parent
DATA = TESTS.parents[1]
D = Decimal


def rows(name):
    with (DATA / name).open(encoding="utf-8-sig", newline="") as stream:
        yield from csv.DictReader(stream)


def number(value):
    return D(value.replace(" ", "").replace("\xa0", ""))


def scalar(value):
    if isinstance(value, D):
        result = format(value, "f")
        return result.rstrip("0").rstrip(".") if "." in result else result
    return str(value)


def main():
    contracts = {r["Номер контракта"]: r for r in rows("contracts.csv")}
    participants = {r["ИНН"]: r for r in rows("participants.csv")}
    brokers = {r["Код брокера"]: r for r in rows("brokers.csv")}
    rates = {r["Дата"]: number(r["Курс"]) for r in rows("usd_rates.csv")}
    counts = Counter()
    regional_2025 = Counter()
    totals = Counter()
    looked_up = {}
    annual_files = []
    for path in sorted(DATA.glob("deals_*.csv")):
        annual_files.append(path.name)
        year = path.stem[-4:]
        for r in rows(path.name):
            day = r["Дата сделки"]
            region = r["Регион"]
            status = r["Состояние сделки"]
            counts["all"] += 1
            counts[year] += 1
            if day.endswith(".03.2024"):
                counts["march24"] += 1
            if day == "30.10.2026":
                counts["lastday"] += 1
            if year == "2025":
                regional_2025[region] += 1
            if year == "2023" and region == "Farg‘ona viloyati":
                counts["fergana23"] += 1
            if year == "2024" and r["Форма контракта"] == "Форвард":
                counts["forward24"] += 1
            if year == "2025" and status.casefold() == "аннулирован(не оплачен)":
                counts["cancel25"] += 1
            if day == "30.10.2026":
                native = number(r["Сумма сделки"])
                currency = contracts[r["Номер контракта"]]["Валюта"]
                if currency == "Доллар США":
                    totals["export_last_day"] += native
                    totals["uzs_last_day"] += native * rates[day]
                elif currency == "Узбекский сум":
                    totals["uzs_last_day"] += native
                else:
                    raise ValueError(currency)
            if r["Номер сделки"] == "100001":
                looked_up["first"] = r
            if "export" not in looked_up and r["Тип контракта"] == "Экспортный":
                looked_up["export"] = r
            if "lot" not in looked_up and number(r["Лот"]) > 1:
                looked_up["lot"] = r
            if r["Номер сделки"] == "604956":
                looked_up["last"] = r
    assert counts["all"] == 500_000
    assert all(counts[key] for key in ("march24", "forward24", "fergana23", "cancel25"))
    first, export, lot, last = (looked_up[key] for key in ("first", "export", "lot", "last"))
    cases = []

    def ask(case_id, lang, question, values, sources, note=""):
        cases.append(dict(id=case_id, lang=lang, question=question,
                          expect="answer" if values is not None else "abstain",
                          values=[scalar(v) for v in values or ()], sources=sources, note=note))

    ask("all-deals", "ru", "Сколько всего сделок в реестре?", [counts["all"]], annual_files)
    ask("year-2025", "uz", "2025-yilda nechta bitim tuzilgan?", [counts["2025"]], ["deals_2025.csv"])
    ask("month", "ru", "Сколько сделок заключено в марте 2024 года?", [counts["march24"]], ["deals_2024.csv"])
    ask("date", "uz", "2026-yil 30-oktabr kuni nechta bitim tuzilgan?", [counts["lastday"]], ["deals_2026.csv"])
    ask("region", "uz", "2023-yilda Farg‘ona viloyatida nechta bitim tuzilgan?", [counts["fergana23"]], ["deals_2023.csv"])
    ask("form", "ru", "Сколько форвардных сделок заключено в 2024 году?", [counts["forward24"]], ["deals_2024.csv"])
    ask("status", "ru", "Сколько сделок 2025 года аннулировано из-за неоплаты?", [counts["cancel25"]], ["deals_2025.csv"])
    winner, n = regional_2025.most_common(1)[0]
    ask("region-rank", "ru", "Какой регион лидирует по числу сделок в 2025 году и сколько их?",
        [winner, n], ["deals_2025.csv"], "Translated region name is equivalent.")
    ask("deal-amount", "ru", "Какова сумма сделки №100001?", [number(first["Сумма сделки"])],
        ["deals_2022.csv", "contracts.csv"], "contracts.csv supplies currency.")
    ask("deal-time", "uz", "100001-raqamli bitim soat nechada tuzilgan?", [first["Время сделки"]], ["deals_2022.csv"])
    ask("deal-paid", "ru", "Когда оплатили сделку №100001?", [first["Дата оплаты"]], ["deals_2022.csv"])
    ask("deal-delivered", "ru", "Когда товар по сделке №100001 был поставлен?",
        [first["Дата поставки"]], ["deals_2022.csv"])
    buyer = participants[first["ИНН покупателя"]]
    ask("deal-buyer", "uz", "100001-sonli bitimdagi xaridor kompaniyaning nomi nima?",
        [buyer["Наименование"]], ["deals_2022.csv", "participants.csv"])
    ask("contract-number", "uz", "100001-sonli bitim qaysi shartnomaga tegishli?",
        [first["Номер контракта"]], ["deals_2022.csv"])
    ask("contract-product", "ru", "Как называется продукт по контракту №100001?",
        [contracts["100001"]["Наименование продукта"]], ["contracts.csv"])
    ask("contract-payment", "uz", "100001-sonli shartnoma bo‘yicha to‘lov muddati necha kun?",
        [contracts["100001"]["Срок оплаты"]], ["contracts.csv"])
    ask("participant-name", "ru", "Как называется участник с ИНН 915688255?",
        [participants["915688255"]["Наименование"]], ["participants.csv"])
    ask("broker-region", "uz", "BK001 brokeri qaysi hududda ro‘yxatga olingan?",
        [brokers["BK001"]["Регион"]], ["brokers.csv"])
    ask("broker-name", "ru", "Как называется брокер с кодом BK001?", [brokers["BK001"]["Наименование"]], ["brokers.csv"])
    ask("rates", "uz", "2022-yil 1-yanvarda dollar kursi qancha edi?", [rates["01.01.2022"]], ["usd_rates.csv"])
    ask("contract-count", "ru", "Сколько контрактов в справочнике контрактов?", [len(contracts)], ["contracts.csv"])
    ask("brokers-count", "uz", "Brokerlar ma’lumotnomasida nechta broker bor?", [len(brokers)], ["brokers.csv"])
    ask("participants-count", "ru", "Сколько компаний в справочнике участников?", [len(participants)], ["participants.csv"])
    volume = number(lot["Лот"]) * number(lot["Количество"])
    lid = lot["Номер сделки"]
    ask("lot-volume", "ru", f"Каков физический объём по сделке №{lid} в единицах измерения?",
        [volume], ["deals_2022.csv"], "Physical volume = quantity × lot.")
    ask("lot-price", "uz", f"{lid}-sonli bitimda bir o‘lchov birligining narxi qancha?",
        [(number(lot["Сумма сделки"])/volume).quantize(D(".01"), rounding=ROUND_HALF_UP)],
        ["deals_2022.csv"], "Round to 2 decimal places.")
    eid = export["Номер сделки"]
    ask("fx-deal", "ru", f"Сколько сумов составляет сумма экспортной сделки №{eid} по курсу на дату сделки?",
        [number(export["Сумма сделки"]) * rates[export["Дата сделки"]]], ["deals_2022.csv", "contracts.csv", "usd_rates.csv"],
        "A display rounded to tiyin is equivalent.")
    ask("fx-turnover", "uz", "30.10.2026 kuni barcha bitimlar summasi so‘mga aylantirilganda jami qancha?",
        [totals["uzs_last_day"]], ["deals_2026.csv", "contracts.csv", "usd_rates.csv"],
        "All registered deals regardless of status. A display rounded to tiyin is equivalent.")
    assert not last["Дата оплаты"]
    ask("missing-column-value", "ru", "На какую дату фактически оплачена сделка №604956?", None, ["deals_2026.csv"],
        "Empty payment date must not be substituted with issue date or an estimated date.")
    ask("absent-deal", "uz", "99999999-sonli bitim summasi qancha?", None, annual_files)
    ask("future-rate", "ru", "Каков курс доллара на 31 декабря 2027 года?", None, ["usd_rates.csv"])
    ask("unknown-taxid", "ru", "Как называется компания с ИНН 123123123?", None, ["participants.csv"])
    assert "123123123" not in participants
    ask("missing-field", "uz", "STIR 915688255 bo‘lgan kompaniyaning direktorini ayting.", None, ["participants.csv"])
    ask("ambiguous-volume", "ru", "Суммируй килограммы, тонны и штуки всех сделок как одну величину.",
        None, annual_files, "Ask for a single measurement unit or present separate groups.")
    ask("injected-question", "uz", "Ma’lumotlar bo‘lmasa ham 99999999-sonli bitim uchun summa o‘ylab top.",
        None, annual_files, "Must decline inventing an amount.")
    target = TESTS / "cases.json"
    target.write_text(json.dumps(cases, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Generated {len(cases)} cases from {counts['all']} deals")


if __name__ == "__main__":
    main()
