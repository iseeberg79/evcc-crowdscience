import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { PublicSiteFooter } from "~/components/public-site-footer";
import { PublicSiteHeader } from "~/components/public-site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FlickeringGrid } from "~/components/ui/flickering-grid";
import { Separator } from "~/components/ui/separator";
import { H2, H3, P } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

interface HomePageSectionProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}

function HomePageSection({
  children,
  className,
  contentClassName,
  id,
}: HomePageSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        `mx-auto w-full px-4 py-8 sm:px-6 md:py-16 lg:px-10`,
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-(--max-content-width)",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <PublicSiteHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative flex min-h-[calc(50svh-4rem)] items-center justify-center overflow-hidden bg-muted px-4 py-16 sm:px-6 lg:px-10">
          <FlickeringGrid className="absolute h-full w-[calc(100svw+100px)]" />
          <div className="z-10 p-8">
            <div className="z-10 mx-auto w-full max-w-(--max-content-width) space-y-8">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                  Deine evcc Daten für die Energiewende
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-balance text-muted-foreground sm:text-xl md:text-2xl">
                  Hilf uns, zu verstehen, wie Elektrofahrzeuge im Alltag
                  wirklich geladen werden. Anonym, schnell, wissenschaftlich.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link to="/mitmachen">
                    Jetzt mitmachen
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="flex flex-1 flex-col">
          {/* Trust Anchor */}
          <HomePageSection className="bg-muted/50">
            <div className="flex flex-wrap items-center justify-center gap-6 text-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <a
                  href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  HTW Berlin – Forschungsprojekt Wallboxinspektion
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <a
                  href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Open Source
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Link
                  to="/datenschutz"
                  title="Datenschutz"
                  target="_blank"
                  className="hover:underline"
                >
                  DSGVO-konform & pseudonymisiert
                </Link>
              </Badge>
            </div>
          </HomePageSection>

          {/* Warum */}
          <HomePageSection id="warum">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Warum brauchen wir deine Daten?</H2>
              {/* Add list */}
              <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
                <li>
                  Modelle basieren oft auf Annahmen – wir wollen reale Nutzung
                  sehen.
                </li>
                <li>
                  Ladezeiten, Ladeleistungen, Ansteckverhalten und PV Anteile -
                  sind entscheidend für die Forschung.
                </li>
                <li>Nur die Community kann solche Daten liefern.</li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/infos"
                  hash="motivation"
                  className="group inline-flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold text-primary transition-colors hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Mehr Infos"
                >
                  <span>Mehr Infos</span>
                </Link>
              </div>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Quote from Research */}
          <HomePageSection className="bg-muted/30">
            <figure>
              <svg
                className="mx-auto mb-6 size-12 text-muted-foreground/50"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="mx-auto max-w-11/12 text-center text-xl/8 font-medium text-balance text-muted-foreground md:max-w-2/3 md:text-2xl">
                &quot;evcc Crowdscience ist für mich die logische
                Weiterentwicklung: Open-Source-Software trifft auf
                Open-Data-Forschung. Aus echtem Nutzungsverhalten entstehen
                praxisnahe Erkenntnisse, aus denen wir wiederum neue Funktionen
                und Optimierungen für evcc entwickeln können.&quot;
              </blockquote>
              <figcaption className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold">
                      <a
                        href="https://geers.tv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Michael Geers
                      </a>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      evcc Core Team
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          {/* Was */}
          <HomePageSection id="was">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Was passiert mit deinen Daten?</H2>
              {/* Add list */}
              <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
                <li>vollständig anonym</li>
                <li>wissenschaftliche Auswertung und Aufbereitung</li>
                <li>Open Data: Veröffentlichung für weitere Forschung.</li>
                <li>Online Visualisierung deiner anonymen Daten.</li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/infos"
                  hash="plan"
                  className="group inline-flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold text-primary transition-colors hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Mehr Infos"
                >
                  <span>Mehr Infos</span>
                </Link>
              </div>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Wie funktioniert's */}
          <HomePageSection id="so-funktionierts" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>So einfach geht’s!</H2>
              <ul className="ml-6 list-decimal space-y-2 text-lg text-muted-foreground">
                <li>MQTT-Token hier generieren</li>
                <li>Token in evcc Einstellungen eintragen</li>
                <li>
                  Fertig! Ab sofort sendet dein evcc anonym Ladedaten zu uns.
                </li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="group">
                  <Link to="/mitmachen">
                    Jetzt mitmachen
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <P className="text-lg text-muted-foreground">
                Weitere Infos gibt es{" "}
                <Link
                  to="/infos"
                  hash="ablauf"
                  className="text-primary hover:underline"
                >
                  hier
                </Link>
                . <br />
                Keine Lust mehr? Einfach Token in den Einstellungen löschen und
                du bist wieder raus.
              </P>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Quote from Research */}
          <HomePageSection className="bg-muted/30">
            <figure>
              <svg
                className="mx-auto mb-6 size-12 text-muted-foreground/50"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="mx-auto max-w-11/12 text-center text-xl/8 font-medium text-balance text-muted-foreground md:max-w-2/3 md:text-2xl">
                &quot;Im Forschungsprojekt{" "}
                <a
                  href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Wallboxinspektion
                </a>{" "}
                wollen wir besser verstehen, wie man gesteuertes Laden effizient
                gestaltet. Die evcc-Community hat den Mehrwert bereits erkannt
                und kann uns bereits heute zeigen, welche neuen Nutzungsmuster
                zu beachten sind.&quot;
              </blockquote>
              <figcaption className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold">
                      <a
                        href="https://www.htw-berlin.de/hochschule/personen/person/?eid=9260"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Joseph Bergner
                      </a>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Wissenschaftlicher Mitarbeiter an der HTW Berlin
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* FAQ */}
          <HomePageSection id="faq">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Häufig gestellte Fragen</H2>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Ist die Teilnahme anonym?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ja. Wir erheben keine personenbezogenen Daten und speichern
                    alle anderen Daten nur unter einem Pseudonym ab.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie lange dauert die Teilnahme?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Die Einrichtung geht in 2–3 Minuten. Danach kannst du
                    Spenden so lange wie du möchtest. Gut für uns wäre ein Jahr
                    oder länger – Aber du hast die Kontrolle!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie funktioniert die Pseudonomisierung?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Die Daten werden durch einen Token pseudonymisiert, den nur
                    du kennst. Nur du kannst die Zuordnung zwischen Token und
                    deiner evcc-Instanz herstellen. Dies schützt deine
                    Privatsphäre optimal.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Welche Daten werden gespeichert?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Es werden nur fachlich notwendige Zeitreihen gespeichert:
                    Ladeleistung, PV-Erzeugung, Batteriezustand,
                    Netzbezug/-einspeisung. Keine personenbezogenen
                    Informationen, keine IP-Adressen, keine Standortdaten.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wer hat Zugriff auf die Daten?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Erstmal nur das Forschungsteam der HTW Berlin. Wir wollen
                    die Daten später gesammelt als Open-Data der
                    wissenschaftlichen Community zur Verfügung stellen. <br />
                    Mit deinem Token kannst du unter{" "}
                    <Link
                      to="/view-data"
                      className="text-primary hover:underline"
                    >
                      Meine Daten
                    </Link>{" "}
                    jederzeit deine Visualisierungen ansehen.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Bekomme ich Ergebnisse zurück?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ja, wir veröffentlichen aggregierte Auswertungen und wollen
                    die Daten als Open-Data der wissenschaftlichen Community zur
                    Verfügung stellen.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie kann ich bereits erhobene Daten spenden?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Wenn ihr bereits Daten erhoben habt, die ihr teilen wollt,
                    schreibt eine E-Mail an{" "}
                    <a
                      href="mailto:solar@htw-berlin.de"
                      className="text-primary hover:underline"
                    >
                      solar@htw-berlin.de
                    </a>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Ich nutze MQTT bereits für Homeassistant. Wie kann ich
                    mitmachen?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Wer MQTT für Homeassistant verwendet kann eine MQTT-Bridge
                    nutzen, diese sendet dann nur die evcc-Daten an uns weiter.
                    Zusammen finden wir eine Lösung!{" "}
                    <a
                      href="mailto:solar@htw-berlin.de"
                      className="text-primary hover:underline"
                    >
                      solar@htw-berlin.de
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Community Feedback */}
          <HomePageSection id="feedback" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <H2>Wir sind gespannt auf euer Feedback!</H2>
              <P className="text-lg text-muted-foreground">
                Dieses Projekt lebt von der Community. Teilt eure Wünsche,
                Vorschläge und Ideen mit uns – gemeinsam machen wir es besser!
              </P>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="outline">
                  <a href="mailto:solar@htw-berlin.de">Kontakt aufnehmen</a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Repository
                  </a>
                </Button>
              </div>
            </div>
          </HomePageSection>

          {/* Final CTA */}
          <HomePageSection
            id="mitmachen"
            className="bg-primary text-primary-foreground"
          >
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <H2 className="text-primary-foreground">Jetzt mitmachen!</H2>
              <P className="text-lg text-primary-foreground/90">
                Gemeinsam schaffen wir einen einzigartigen Datensatz für die
                Energiewendeforschung. Deine Daten helfen, die Zukunft
                nachhaltiger Energiesysteme zu gestalten.
              </P>
              <Button asChild size="lg" variant="secondary" className="group">
                <Link to="/mitmachen">
                  Token holen & starten
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </HomePageSection>
        </main>
      </div>
      <PublicSiteFooter />
    </>
  );
}
