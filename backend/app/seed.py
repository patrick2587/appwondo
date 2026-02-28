"""Seed script: creates admin user, default chat channels, training events, and wiki pages."""

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.passwords import hash_password
from app.config import settings
from app.database import async_session
from app.models.calendar import Event
from app.models.chat import ChatChannel, ChatChannelMember, ChannelType
from app.models.user import Role, User
from app.models.wiki import WikiPage


async def seed_admin(db: AsyncSession) -> str:
    result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    admin = result.scalar_one_or_none()
    if admin:
        return admin.id

    admin = User(
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        display_name="Admin",
        role=Role.ADMIN,
    )
    db.add(admin)
    await db.flush()
    print(f"Admin-Benutzer erstellt: {settings.ADMIN_EMAIL}")
    return admin.id


async def seed_channels(db: AsyncSession, admin_id: str) -> None:
    result = await db.execute(select(ChatChannel))
    if result.scalars().first():
        return

    channels = [
        ("Allgemein", ChannelType.PUBLIC),
        ("Training", ChannelType.PUBLIC),
        ("Veranstaltungen", ChannelType.PUBLIC),
    ]
    for name, ctype in channels:
        ch = ChatChannel(name=name, type=ctype, created_by=admin_id)
        db.add(ch)
        await db.flush()
        db.add(ChatChannelMember(channel_id=ch.id, user_id=admin_id))
    print("Chat-Kanale erstellt: Allgemein, Training, Veranstaltungen")


async def seed_events(db: AsyncSession, admin_id: str) -> None:
    result = await db.execute(select(Event))
    if result.scalars().first():
        return

    from datetime import date

    # Find next Monday from now
    today = date.today()
    days_until_monday = (0 - today.weekday()) % 7
    if days_until_monday == 0:
        next_monday = today
    else:
        next_monday = today + timedelta(days=days_until_monday)

    days_until_tuesday = (1 - today.weekday()) % 7
    if days_until_tuesday == 0:
        next_tuesday = today
    else:
        next_tuesday = today + timedelta(days=days_until_tuesday)

    days_until_friday = (4 - today.weekday()) % 7
    if days_until_friday == 0:
        next_friday = today
    else:
        next_friday = today + timedelta(days=days_until_friday)

    events = [
        Event(
            title="Training SSV Torgau",
            description="Regulares Training fur Kinder, Jugendliche und Erwachsene",
            location="SSV 1952 Torgau, Sudringturnhalle, Sudring 17a",
            start_time=datetime(next_monday.year, next_monday.month, next_monday.day, 18, 0, tzinfo=UTC),
            end_time=datetime(next_monday.year, next_monday.month, next_monday.day, 20, 0, tzinfo=UTC),
            rrule="FREQ=WEEKLY;BYDAY=MO",
            created_by=admin_id,
        ),
        Event(
            title="Training SSV Torgau",
            description="Regulares Training fur Kinder, Jugendliche und Erwachsene",
            location="SSV 1952 Torgau, Sudringturnhalle, Sudring 17a",
            start_time=datetime(next_friday.year, next_friday.month, next_friday.day, 17, 0, tzinfo=UTC),
            end_time=datetime(next_friday.year, next_friday.month, next_friday.day, 19, 0, tzinfo=UTC),
            rrule="FREQ=WEEKLY;BYDAY=FR",
            created_by=admin_id,
        ),
        Event(
            title="Training JWG",
            description="Training fur Schuler des Johann-Walter-Gymnasiums (pausiert wahrend der sachsischen Schulferien)",
            location="Johann-Walter-Gymnasium, Schlossstr. 7-9",
            start_time=datetime(next_tuesday.year, next_tuesday.month, next_tuesday.day, 15, 0, tzinfo=UTC),
            end_time=datetime(next_tuesday.year, next_tuesday.month, next_tuesday.day, 16, 0, tzinfo=UTC),
            rrule="FREQ=WEEKLY;BYDAY=TU",
            created_by=admin_id,
        ),
    ]
    # One-time events from taekwondo-torgau.de/termine/
    one_time_events = [
        Event(
            title="Lehrgang in Lichtenfels",
            description="Trainingseinheit offen fur alle Teilnehmer. Leitung: Torsten Stamm, 4. DAN",
            location="Taekwon-Do Center Lichtenfels, Bamberger Strasse 50, 96215 Lichtenfels",
            start_time=datetime(2026, 2, 28, 13, 0, tzinfo=UTC),
            end_time=datetime(2026, 2, 28, 15, 0, tzinfo=UTC),
            rrule=None,
            created_by=admin_id,
        ),
        Event(
            title="Tag der offenen Tur - SSV 1952 Torgau",
            description="Vorfuhrungen verschiedener Kampfsport-Abteilungen. Taekwon-Do Vorfuhrung: 10:40-11:00 Uhr",
            location="Sudringhalle, Sudring 17a, Torgau",
            start_time=datetime(2026, 4, 18, 10, 0, tzinfo=UTC),
            end_time=datetime(2026, 4, 18, 13, 0, tzinfo=UTC),
            rrule=None,
            created_by=admin_id,
        ),
        Event(
            title="Kinderkirchweih Schwabach",
            description="Vorbereitungstraining, offentliche Vorfuhrung und Prufungen. Leitung: Torsten Stamm, 4. DAN",
            location="SC 04 Schwabach",
            start_time=datetime(2026, 4, 25, 9, 0, tzinfo=UTC),
            end_time=datetime(2026, 4, 26, 17, 0, tzinfo=UTC),
            rrule=None,
            created_by=admin_id,
        ),
        Event(
            title="Taekwon-Do Trainingscamp Torgau",
            description="Mehrtaegiges Trainingscamp. Gesamtleitung: Eduard Lahner, 5. DAN (Nurnberg). Organisation: Torsten Stamm, 4. DAN. Detaillierter Ablaufplan folgt.",
            location="Torgau",
            start_time=datetime(2026, 8, 6, 9, 0, tzinfo=UTC),
            end_time=datetime(2026, 8, 9, 17, 0, tzinfo=UTC),
            rrule=None,
            created_by=admin_id,
        ),
    ]
    events.extend(one_time_events)

    for event in events:
        db.add(event)
    print("Termine erstellt (3 wiederkehrend, 4 Veranstaltungen)")


async def seed_wiki(db: AsyncSession, admin_id: str) -> None:
    result = await db.execute(select(WikiPage))
    if result.scalars().first():
        return

    pages: list[dict] = [
        {
            "slug": "taekwon-do-torgau",
            "title": "Taekwon-Do Torgau",
            "parent_slug": None,
            "content": """# Taekwon-Do Torgau

Willkommen beim **Traditional Taekwon-Do Black Belt Center Torgau**, Mitglied im Traditional Taekwondo Black Belt Center e.V.

Ab Januar Training im SSV immer Montag und Freitag.

Unser Schulleiter **Torsten Stamm** bringt eine 25-jaehrige, kontinuierliche Ausbildung im traditionellen Taekwon-Do mit. Seit 2006 leitet er zudem ein Center in Schwabach bei Nuernberg.

Bei uns geht es nicht um einen Wettkampfsport, sondern um eine Kampfkunst, die koerperlich gesund und geistig fit macht - fuer alle Altersgruppen.

## Training

- **SSV 1952 Torgau (Suedringturnhalle):** Montag 18:00-20:00, Freitag 17:00-19:00
- **Johann-Walter-Gymnasium:** Dienstag 15:00-16:00

## Partnerschaft

Regelmaessige Lehrganege und Kurse finden gemeinsam mit unseren Partnerschulen in Nuernberg, Schwabach und Lichtenfels statt, geleitet von erfahrenen Trainern unseres Verbandes.
""",
        },
        {
            "slug": "dojang",
            "title": "Unser Dojang",
            "parent_slug": "taekwon-do-torgau",
            "content": """# Unser Dojang

Im Koreanischen wird eine Lehr- und Uebungsstätte als **Dojang** bezeichnet. Es ist der Ort, an dem die Uebenden ihre ganze Energie auf das Erlernen des Taekwon-Do konzentrieren und den Alltag hinter sich lassen.

## Trainingsstaetten

### SSV 1952 Torgau - Suedringturnhalle
- **Adresse:** Suedring 17a, 04860 Torgau
- **Montag:** 18:00 - 20:00 Uhr
- **Freitag:** 17:00 - 19:00 Uhr
- **Gruppen:** Kinder, Jugendliche, Erwachsene

### Johann-Walter-Gymnasium
- **Adresse:** Schlossstrasse 7-9, 04860 Torgau
- **Dienstag:** 15:00 - 16:00 Uhr
- **Gruppen:** Schueler des JWG (per Einschreibung)

## Hinweise

Das Training beim SSV 1952 Torgau findet mit wenigen Ausnahmen **ganzjaehrig** statt, auch waehrend der Schulferien. Das Training am JWG pausiert waehrend der saechsischen Schulferien, da die Turnhalle dann nicht zur Verfuegung steht.

Aktuelle Informationen gibt es ueber den E-Mail-Newsletter.
""",
        },
        {
            "slug": "trainingsplan",
            "title": "Trainingsplan",
            "parent_slug": "taekwon-do-torgau",
            "content": """# Trainingsplan

Wir bieten Training an zwei Standorten an:

| Tag | Zeit | Ort | Gruppen |
|-----|------|-----|---------|
| Montag | 18:00 - 20:00 | SSV 1952 Torgau, Suedringturnhalle, Suedring 17a | Kinder, Jugendliche, Erwachsene |
| Dienstag | 15:00 - 16:00 | Johann-Walter-Gymnasium, Schlossstrasse 7-9 | JWG-Schueler (per Einschreibung) |
| Freitag | 17:00 - 19:00 | SSV 1952 Torgau, Suedringturnhalle, Suedring 17a | Kinder, Jugendliche, Erwachsene |

## Hinweise

- Das Training beim SSV 1952 Torgau findet mit wenigen Ausnahmen **ganzjaehrig** statt, auch waehrend der Schulferien.
- Das Training am Johann-Walter-Gymnasium **pausiert** waehrend der saechsischen Schulferien, da die Turnhalle dann nicht zur Verfuegung steht.
- Seit April 2025 trainieren wir als Abteilung "Traditionelles Taekwon-Do" innerhalb der Budokai-Abteilung des SSV 1952 Torgau.
- Derzeit trainieren in der Aufbauphase alle Altersgruppen gemeinsam.
- Aktuelle Informationen gibt es ueber den E-Mail-Newsletter.
""",
        },
        {
            "slug": "probetraining",
            "title": "Probetraining",
            "parent_slug": "taekwon-do-torgau",
            "content": """# Probetraining

Probetraining bieten wir ab April 2025 beim SSV 1952 Torgau an.

## Kostenlos und unverbindlich

Das Probetraining ist **kostenlos und unverbindlich**. Du kannst **bis zu dreimal** teilnehmen, um zu schauen, ob Taekwon-Do das Richtige fuer dich ist.

Das Angebot gilt fuer Interessierte **ab ca. 7 Jahren**.

## Was du mitbringen solltest

T-Shirt und Jogginghose reichen als Trainingsbekleidung fuer den Anfang vollkommen aus. Trainiert wird **barfuss** - es werden keine speziellen Schuhe benoetigt.

Bitte komm ca. **10 Minuten frueher**, damit du dich in Ruhe umziehen und offene Fragen klaeren kannst.

## Gut zu wissen

Derzeit trainieren in der Aufbauphase der Abteilung alle Altersgruppen gemeinsam. Sobald genuegend regelmaessige Teilnehmer zusammenkommen, wird das Training in Kinder (ca. 6/7 bis ~13 Jahre) und Erwachsene (ab ca. 14 Jahre) aufgeteilt.

Familien koennen nach Absprache ebenfalls gemeinsam am Training teilnehmen, wenn die Kinder bereits Erfahrung im traditionellen Taekwon-Do mitbringen.

## Anmeldung

Bitte melde dich vorher kurz per E-Mail oder Telefon an:
- **E-Mail:** info@taekwondo-torgau.de
- **Telefon:** +49-(0)160-97505050
""",
        },
        {
            "slug": "termine",
            "title": "Termine",
            "parent_slug": "taekwon-do-torgau",
            "content": """# Termine

Alle aktuellen Termine findest du in unserem **Kalender**.

Nutze die Kalender-Funktion in der Seitenleiste, um dir alle anstehenden Veranstaltungen, Lehrganege und Trainingszeiten anzeigen zu lassen.
""",
        },
        {
            "slug": "traditionelles-taekwon-do",
            "title": "Traditionelles Taekwon-Do",
            "parent_slug": None,
            "content": """# Traditionelles Taekwon-Do

## Was bedeutet Taekwon-Do?

- **TAE** (Fuss): Alle Fusstechniken. Tae beinhaltet das Springen, Schlagen und Stossen unter Ausnutzung aller Moeglichkeiten der Beine.
- **KWON** (Faust): Alle Hand- und Armtechniken - Schlaege, Stoesse und Abwehrtechniken.
- **DO** (der Weg): Der geistige und mentale Weg, den man durch konsequentes Ueben ueber Jahre oder ein Leben lang beschreitet.

## Ursprung

Taekwon-Do hat seinen Ursprung in **Korea** und blickt auf eine ueber **2000-jaehrige Geschichte** zurueck. Historisch diente es dem Kampf und der Selbstverteidigung. Unter Fremdherrschaft mussten Praktizierende die Kunst im Verborgenen bewahren.

## Traditionell vs. olympisch

Wir trainieren die **traditionelle Form** des Taekwon-Do - **ohne Vollkontakt**. Dies unterscheidet uns grundlegend vom olympischen WTF-Stil mit Vollkontaktwettkampf.

Unser Fokus liegt auf **Kampfkunst**, nicht auf Wettkampfsport.

## Was bringt Taekwon-Do?

- Psychische und physische Balance
- Koerperkoordination und Koerperbewusstsein
- Praezise Techniksteuerung durch Partneruebungen
- Selbstvertrauen und Respekt gegenueber Trainern und Partnern
- Ganzheitliche Persoenlichkeitsentwicklung

*Originaltext: Iris Lahner, ueberarbeitet von Torsten Stamm*
""",
        },
        {
            "slug": "bestandteile",
            "title": "Die Bestandteile des Taekwon-Do",
            "parent_slug": "traditionelles-taekwon-do",
            "content": """# Die Bestandteile des Taekwon-Do

Das traditionelle Taekwon-Do besteht aus vier Hauptkomponenten:

## 1. Hyong (Formenlauf)

Festgelegte Bewegungsablaeufe, die als Schattenkampf gegen einen imaginaeren Gegner ausgefuehrt werden. Jede Hyong hat einen historischen Hintergrund und eine bestimmte Anzahl von Bewegungen. Die 20 traditionellen Hyongs bilden ein zentrales Element des Trainings.

## 2. Kyek-Pa (Bruchtest)

Demonstration von Kraft, Technik und Praezision durch das Zerbrechen von Brettern oder anderen Materialien mit verschiedenen Hand- und Fusstechniken.

## 3. Taeryon (Partneruebungen/Kampf)

Kontrollierte Uebungen mit einem Partner zur Anwendung von Techniken. Im traditionellen Taekwon-Do steht die Kontrolle im Vordergrund - nicht der Vollkontakt.

## 4. Hosinsul (Selbstverteidigung)

Praktische Selbstverteidigungstechniken fuer reale Situationen, einschliesslich Befreiungstechniken, Hebel und Wuerfe.
""",
        },
        {
            "slug": "die-20-hyongs",
            "title": "Die 20 Hyongs des traditionellen Taekwon-Do",
            "parent_slug": "traditionelles-taekwon-do",
            "content": """# Die 20 Hyongs des traditionellen Taekwon-Do

Hyong (auch Hyeong) ist die traditionelle koreanische Bezeichnung fuer den Formenlauf im Taekwon-Do. Es handelt sich um festgelegte Abfolgen von Techniken, die als Schattenkampf gegen einen imaginaeren Gegner ausgefuehrt werden.

## Uebersicht aller 20 Hyongs

| Nr. | Name | Bew. | Bedeutung |
|-----|------|------|-----------|
| 1 | **Chon-Ji** | 19 | "Der Himmel und die Erde" - Erschaffung der Welt und der Menschheit |
| 2 | **Tan-Gun** | 21 | Legendaerer Gruender Koreas, 2333 v. Chr. |
| 3 | **To-San** | 24 | Patriot Ahn Chang-Ho (1876-1938), Vorkämpfer fuer Bildung |
| 4 | **Won-Hyo** | 28 | Buddhistischer Moench, der 686 n. Chr. den Buddhismus in die Silla-Dynastie einfuehrte |
| 5 | **Yul-Kok** | 38 | Philosoph Li-Le (1536-1584), der "Konfuzius von Korea" |
| 6 | **Chun-Gun** | 32 | Patriot An Chun-Gun - 32 steht fuer sein Lebensalter bei der Hinrichtung 1910 |
| 7 | **T'oi-Gye** | 37 | Gelehrter Li-Hwang (16. Jh.) - 37 verweist auf den Breitengrad seines Geburtsortes |
| 8 | **Hwa-Rang** | 29 | Jugendbewegung des 4.-9. Jh., die zur Vereinigung der drei koreanischen Koenigreiche beitrug |
| 9 | **Chung-Mu** | 30 | Admiral Yi Sun-Sin, Entwickler des ersten gepanzerten Kriegsschiffs |
| 10 | **Gwang-Gae** | 39 | Koenig Gwang-Gae T'o-Wang - 39 steht fuer seine Regierungsjahre |
| 11 | **P'o-Eun** | 36 | Dichter und Gelehrter Chong Mong-Chu (ca. 1400) |
| 12 | **Ge-Baek** | 44 | General des Baekje-Reiches (ca. 660), bekannt fuer militaerische Disziplin |
| 13 | **Yu-Sin** | 68 | General Kim Yu-Sin, Vereiniger Koreas (668 n. Chr.) - die laengste aller Hyongs |
| 14 | **Chung-Yan** | 52 | General Kim Dok-Ryong, Sieger im Imjin-Krieg |
| 15 | **Ul-Ji** | 42 | General Ul-Ji Mun Duk (7. Jahrhundert) |
| 16 | **Sam-Il** | 33 | Erinnert an den Unabhaengigkeitstag am 1. Maerz 1919 |
| 17 | **Ko-Dang** | 39 | Patriot Cho Man-Ski, Unabhaengigkeitskaempfer |
| 18 | **Ch'oi-Yong** | 45 | Kanzler und General Ch'oi Yong (14. Jahrhundert) |
| 19 | **Se-Yong** | 24 | Koenig Se-Yong (1443), Erfinder des koreanischen Alphabets Hangul - 24 steht fuer die Anzahl der Buchstaben |
| 20 | **T'ong-Il** | 56 | Symbolisiert die Wiedervereinigung von Nord- und Suedkorea |

## Historischer Hintergrund

Die urspruenglichen 20 Hyongs wurden von **General Choi Hong-Hi** gelehrt. Spaeter erweiterte er das System auf 24 Formen mit veraenderten Stellungen und neuer Terminologie (von Hyong zu Tul). Schulen unter **Kwon Jae-Hwa** unterrichten weiterhin die originalen 20 Hyongs.
""",
        },
        {
            "slug": "taekwon-do-fuer-sie",
            "title": "Taekwon-Do fuer Sie?",
            "parent_slug": None,
            "content": """# Taekwon-Do fuer Sie?

Traditionelles Taekwon-Do fuer interessierte Maenner, Frauen und Kinder **ab ca. 7 Jahren**.

Wer einmal beginnt, ist zunaechst gefesselt von der **Vielfaeltigkeit, Disziplin, Energie und Eleganz** der Bewegungsformen im traditionellen Taekwon-Do.

## Was bewirkt das Training?

Durch regelmaessiges Training verbessern sich:
- **Reaktionsvermoegen** und Koerperbewusstsein
- **Koerperhaltung** und sicheres Auftreten
- **Selbstvertrauen** und respektvoller Umgang mit anderen

Das Training umfasst den Bereich vom **Ausgleichssport** ueber **Familienteilnahme** bis hin zum **Leistungssport**. Frauen und Maedchen zeigen dabei, dass Anmut und Harmonie sich mit koerperlicher und psychischer Staerke verbinden lassen.

Auch Menschen mit **koerperlichen Einschraenkungen** oder gesundheitlichen Besonderheiten koennen in der Regel am Training teilnehmen. Sprich uns einfach an!

*Originaltext: Iris Lahner*
""",
        },
        {
            "slug": "kinder-familien",
            "title": "Kinder & Familien",
            "parent_slug": "taekwon-do-fuer-sie",
            "content": """# Taekwon-Do fuer Kinder & Familien

## Entwicklung fuer Kinder

Kinder entwickeln durch das Training schrittweise ein bewusstes **Koerpergefuehl**. Durch das strukturierte Training und die Gruppenuebungen werden **Bescheidenheit, Hoeflichkeit und Disziplin** vermittelt.

Das Vorfuehren von Techniken und Formen vor anderen staerkt das **Gemeinschaftsgefuehl** und baut **Selbstbewusstsein** auf - ein sehr guter Schutz gegen alle Gefahren des Alltags.

## Familientraining

Bei uns koennen **Familien gemeinsam** trainieren - unabhaengig vom jeweiligen Leistungsstand. Das staerkt den Zusammenhalt und macht Spass!
""",
        },
        {
            "slug": "selbstverteidigung",
            "title": "Selbstverteidigung",
            "parent_slug": "taekwon-do-fuer-sie",
            "content": """# Taekwon-Do zur Selbstverteidigung / Selbstbehauptung

Die jahrtausende zurueckreichenden Wurzeln des Taekwon-Do liegen in der waffenlosen Verteidigung gegen Angreifer.

## Hosinsul

**Hosinsul** ist der koreanische Begriff fuer die Selbstverteidigungstechniken, die im Rahmen des traditionellen Taekwon-Do-Unterrichts gelehrt werden:
- **Blocktechniken** - Abwehr von Angriffen
- **Hebel- und Gelenktechniken** - Kontrolliertes Festhalten
- **Stabilisierungs- und Fixierungstechniken** - Neutralisierung von Angreifern

Nahezu alle Techniken und Bewegungskombinationen im Taekwon-Do-Training zielen darauf ab, auf koerperliche Angriffe vorbereitet zu sein - von Reaktionsschnelligkeit und Ausweichbewegungen ueber verschiedene Blocktechniken bis hin zu Takedowns und Neutralisierung von Angreifern.

## Grundsatz: Verhaeltnismaessigkeit

Das oberste Prinzip ist der **Grundsatz der Verhaeltnismaessigkeit**: Abwehrmassnahmen muessen dem Umfang entsprechen, der notwendig ist, um Angriffe auf die eigene koerperliche Unversehrtheit zu stoppen oder zu beenden. Dies gilt gleichermassen fuer die Verteidigung anderer gegen Gewalt.
""",
        },
        {
            "slug": "berufsausbildung",
            "title": "Berufsausbildung & Fortbildung",
            "parent_slug": "taekwon-do-fuer-sie",
            "content": """# Taekwon-Do zur Berufsausbildung und Berufsfortbildung

## Ausbildung zum Schulleiter / Gruppenleiter / Trainer

Unser Center bietet eine Ausbildung bis zu verschiedenen Meisterstufen (DAN-Graduierungen). Neben der mentalen und physischen Staerkung eroeffnen sich dadurch auch neue **berufliche Perspektiven** fuer diejenigen, die selbst eine Taetigkeit als Taekwon-Do-Trainer, Gruppenleiter oder Taekwon-Do-Schulleiter anstreben.

Der Meistergrad befaehigt zur qualifizierten Leitung des Taekwon-Do-Unterrichtes, von Taekwon-Do-Gruppen oder einer eigenen Taekwon-Do-Schule.

## Qualifizierte Selbstverteidigung fuer Berufsgruppen

Unser Selbstverteidigungstraining in der **Gewaltabwehr** ist besonders relevant fuer:

- **Polizei** und Ordnungskraefte
- **Justizvollzug** und Sicherheitsdienste
- **Notaerzte** und medizinisches Personal
- **Pflegekraefte** in Kliniken und Heimen
- **Lehrer** und Erzieher
- **Oeffentlicher Dienst** und Verkehrsbetriebe
""",
        },
        {
            "slug": "impressum",
            "title": "Impressum",
            "parent_slug": None,
            "content": """# Impressum

## Angaben gemaess § 5 TMG

**Torsten Stamm**
Taekwon-Do Center Torgau
Wintergruene 6
04860 Torgau
Deutschland

## Kontakt

- **Telefon:** +49-(0)160-97505050
- **E-Mail:** info@taekwondo-torgau.de

## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemaess § 27a Umsatzsteuergesetz:
**DE261085140**

Umsatzsteuerbefreit (Kleinunternehmerregelung).

## Verantwortlich gemaess § 18 Abs. 2 MStV

Torsten Stamm (Anschrift wie oben)

## Streitbeilegung

Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch bereit.
""",
        },
    ]

    page_map: dict[str, str] = {}  # slug -> id

    # First pass: create all pages without parents
    for page_data in pages:
        if page_data["parent_slug"] is None:
            page = WikiPage(
                slug=page_data["slug"],
                title=page_data["title"],
                content=page_data["content"],
                parent_id=None,
                created_by=admin_id,
            )
            db.add(page)
            await db.flush()
            page_map[page_data["slug"]] = page.id

    # Second pass: create child pages
    for page_data in pages:
        if page_data["parent_slug"] is not None:
            parent_id = page_map.get(page_data["parent_slug"])
            page = WikiPage(
                slug=page_data["slug"],
                title=page_data["title"],
                content=page_data["content"],
                parent_id=parent_id,
                created_by=admin_id,
            )
            db.add(page)
            await db.flush()
            page_map[page_data["slug"]] = page.id

    print(f"Wiki-Seiten erstellt: {len(pages)} Seiten")


async def run_seed() -> None:
    async with async_session() as db:
        admin_id = await seed_admin(db)
        await seed_channels(db, admin_id)
        await seed_events(db, admin_id)
        await seed_wiki(db, admin_id)
        await db.commit()
    print("Seed abgeschlossen!")


if __name__ == "__main__":
    asyncio.run(run_seed())
