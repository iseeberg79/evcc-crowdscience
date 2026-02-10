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
    <section id={id} className={cn(`mx-auto w-full py-8 md:py-16`, className)}>
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

export const Route = createFileRoute("/_public/details")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      {/* Hero Section */}
      {/* <section className="relative flex min-h-[calc(50svh-4rem)] items-center justify-center overflow-hidden bg-muted px-4 py-16 sm:px-6 lg:px-10">
        <FlickeringGrid className="absolute h-full w-[calc(100svw+100px)]" />
        <div className="z-10 p-8">
          <div className="z-10 mx-auto w-full max-w-(--max-content-width) space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                Deine evcc Daten für die Energiewende
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-balance text-muted-foreground sm:text-xl md:text-2xl">
                Crowdscience-Projekt der{" "}
                <a
                  href="https://solar.htw-berlin.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  HTW Berlin
                </a>{" "}
                zur Erforschung dezentraler Energiesysteme
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
      </section> */}

      <main className="flex flex-1 flex-col">
        {/* Trust Anchor */}
        {/* <HomePageSection className="bg-muted/50">
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
        </HomePageSection> */}

        {/* Motivation */}
        <HomePageSection id="motivation" className="pt-0 md:pt-0 lg:pt-0">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Warum brauchen wir deine Daten?</H2>
            <P className="text-lg text-muted-foreground">
              In unserer Energieforschung von dezentralen Energiesystemen sind
              wir auf Zeitreihen-Daten angewiesen. Sie dienen als Eingangsdaten
              von Simulationen und helfen uns die Systeme und Interaktionen aus
              Solaranlage, Batterie, Elektroauto und/oder Wärmepumpen besser zu
              verstehen.
            </P>
            <P className="text-lg text-muted-foreground">
              Nur so können wir Lösungen entwickeln und technische
              Herausforderungen antizipieren, die wir für die Energiewende
              brauchen. Hinter unserer Arbeit steht dabei keine Firma und kein
              Profitinteresse sondern die Überzeugung, dass wir mit unserer
              Forschung die Energiewende unterstützen wollen.
            </P>
            <P className="text-lg text-muted-foreground">
              Das Problem: Es gibt aktuell keinen vergleichbaren offenen
              Datensatz mit realen Daten aus dezentralen Energiesystemen.
            </P>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Das ist der Plan */}
        <HomePageSection id="plan" className="scroll-mt-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Das ist der Plan</H2>
            <P className="text-lg text-muted-foreground">
              Als Nutzende von evcc hantiert ihr täglich mit diesen für uns
              zentralen Daten. Wir möchten unsere Forschung und die Forschung
              anderer gerne mit eueren Datenspenden voranbringen.
            </P>
            <P className="text-lg text-muted-foreground">
              Hierfür wollen wir anonymisierte Daten eurer evcc aufzeichnen und
              als offenen Datensatz zur Verfügung stellen. Dies wäre ein
              einmaliger Datensatz, der je nach Anzahl an Teilnehmenden einen
              wichtigen Beitrag zur dezentralen Energiesystemforschung leisten
              kann.
            </P>
            <P className="text-lg text-muted-foreground">
              Wichtig ist uns: Neben einer wünschenswerten Detailtiefe des
              Datensatzes sollen durch strikte Anonymisierung keine Abstriche
              beim Datenschutz gemacht werden!
            </P>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Mehrwert */}
        <HomePageSection id="mehrwert">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Was ist der Mehrwert?</H2>

            <div className="space-y-4">
              <H3>Für die Forschung</H3>
              <P className="text-muted-foreground">
                Ein einmaliger offener Datensatz mit realen Daten aus
                dezentralen Energiesystemen, der reproduzierbare Analysen
                ermöglicht und fundierte Entscheidungen jenseits von Marketing
                unterstützt.
              </P>
            </div>

            <div className="space-y-4">
              <H3>Für die Community</H3>
              <P className="text-muted-foreground">
                Auch ohne eigene InfluxDB die Möglichkeit der langfristigen
                Speicherung von Zeitreihen mit Visualisierungen. Ein wichtiger
                Mehrwert darüber hinaus sind geplante features, wie ein
                Vergleich mit anderen Instanzen – aktuell nur unter Bekannten
                möglich.
              </P>
            </div>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Wie funktioniert's */}
        <HomePageSection id="so-funktionierts" className="bg-muted/30">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Ablauf</H2>
            <P className="text-lg text-muted-foreground">
              Wir haben uns für eine Token-basierte Anmeldung und
              MQTT-Datenspende entschieden. Die Daten werden in InfluxDB
              gespeichert und sind auf der Webseite unter Angabe des Tokens für
              euch einsehbar.
            </P>
            <P className="text-lg text-muted-foreground">
              Alle Daten aus evcc, die persönliche Informationen enthalten
              könnten werden nicht gespeichert. Wer die Zuordnung des Tokens zu
              euch nicht kennt kann die Daten nicht zuordnen (Pseudonymisierung,
              die nur euch bekannt ist).
            </P>
            <P className="text-lg text-muted-foreground">
              Wenn ihr nicht mehr mitmachen wollt, beendet ihr die Datenspende
              einfach, indem ihr unseren MQTT Broker wieder aus evcc entfernt.
              Mitglieder der Forschungsgruppe haben die Möglichkeit, alle
              Instanzen zu betrachten und zu vergleichen.
            </P>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/mitmachen">
                  Zur Anleitung
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Datenschutz */}
        <HomePageSection id="datenschutz">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Datenschutz & Anonymisierung</H2>
            <P className="text-lg text-muted-foreground">
              Deine Anonymität hat höchste Priorität:
            </P>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>
                Keine Speicherung personenbezogener Informationen aus evcc
              </li>
              <li>
                Pseudonymisierung per Token – ohne Kenntnis des Tokens keine
                Zuordnung möglich
              </li>
              <li>Datenspende jederzeit in evcc deaktivierbar</li>
              <li>Keine IP-Adressen oder Standortdaten</li>
            </ul>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link to="/datenschutz" target="_blank" title="Datenschutz">
                  Datenschutzerklärung lesen
                </Link>
              </Button>
            </div>
          </div>
        </HomePageSection>

        {/* <Separator className="mx-auto w-full max-w-(--max-content-width)" /> */}

        {/* Community Feedback */}
        {/* <HomePageSection id="feedback" className="bg-muted/30">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <H2>Wir sind gespannt auf euer Feedback!</H2>
            <P className="text-lg text-muted-foreground">
              Dieses Projekt lebt von der Community. Teilt eure Wünsche,
              Vorschläge und Ideen mit uns – gemeinsam machen wir es besser!
            </P>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="outline">
                <a href="mailto:lukas.frey@htw-berlin.de">Kontakt aufnehmen</a>
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
        </HomePageSection> */}

        {/* Final CTA */}
        {/* <HomePageSection
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
        </HomePageSection> */}
      </main>
    </>
  );
}
