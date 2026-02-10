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

export const Route = createFileRoute("/_public/infos")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <HomePageSection id="hintergrund" className="scroll-mt-20 pt-0 md:pt-0 lg:pt-0">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>Hintergrund</H2>
            <P className="text-lg text-muted-foreground">
              Reale Ladeprofile von Elektrofahrzeugen sind für Forschung und
              Energiewirtschaft von großer Bedeutung. Viele Modelle basieren auf
              Annahmen, doch das tatsächliche Ladeverhalten unterscheidet sich
              oft deutlich von theoretischen Szenarien. Das zeigen auch unsere
              bisherigen Untersuchungen, etwa zur Varianz beim solaren Laden und
              den Einflussfaktoren auf den PV Anteil.
            </P>
            <P className="text-lg text-muted-foreground">
              Um diese Lücke zu schließen, führen wir ein Crowdscience Projekt
              durch, das Nutzerinnen und Nutzer von Wallboxen und EV Lösungen
              aktiv einbindet. Die Teilnahme ist anonym, freiwillig und in
              wenigen Minuten möglich.
            </P>

            <H3>Ziel des Projekts</H3>
            <P className="text-lg text-muted-foreground">
              Wir möchten verstehen,
            </P>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>wann und wie lange tatsächlich geladen wird</li>
              <li>wie hoch die reale Ladeleistung ist</li>
              <li>wie sich PV Überschussladen im Alltag verhält</li>
              <li>welche Muster, Abweichungen und Besonderheiten auftreten</li>
              <li>und wie groß die Varianz zwischen Haushalten ist</li>
            </ul>

            <P className="text-lg text-muted-foreground">
              Diese Daten ermöglichen wissenschaftliche Analysen, wie sie in
              unserer Studie zu realen Solar Ladeprofilen bereits durchgeführt
              wurden. Sie helfen uns, reale Nutzung sichtbar zu machen – nicht
              mehr und nicht weniger.
            </P>

            <H3>Teilnahme</H3>
            <P className="text-lg text-muted-foreground">
              Die Teilnahme erfolgt über unsere Projektseite:{" "}
              <a
                href="https://evcc-crowdscience.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://evcc-crowdscience.de/
              </a>
              . Dort können Nutzerinnen und Nutzer ihre evcc-Daten anonym
              bereitstellen. Es werden keine personenbezogenen Daten erhoben;
              alle Informationen werden ausschließlich für Forschungszwecke
              genutzt.
            </P>

            <H3>Nutzen für Teilnehmende</H3>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>Unterstützung unabhängiger Forschung an der HTW Berlin</li>
              <li>
                Beitrag zu einem offenen Datensatz, der reale Ladeverhalten
                sichtbar macht
              </li>
              <li>Einblicke in aggregierte Ergebnisse</li>
              <li>
                Stärkung der Open Science Community im Bereich Energie und
                Mobilität
              </li>
            </ul>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Motivation */}
        <HomePageSection id="motivation" className="scroll-mt-10">
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
        <HomePageSection id="mehrwert" className="scroll-mt-10">
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
        <HomePageSection
          id="ablauf"
          className="scroll-mt-10 bg-muted/30"
        >
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
        <HomePageSection id="datenschutz" className="scroll-mt-10">
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
      </main>
    </>
  );
}
