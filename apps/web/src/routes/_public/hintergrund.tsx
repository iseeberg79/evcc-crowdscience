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

export const Route = createFileRoute("/_public/hintergrund")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <HomePageSection id="hintergrund" className="pt-0 md:pt-0 lg:pt-0">
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

            <H2>Ziel des Projekts</H2>
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

            <H2>Teilnahme</H2>
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

            <H2>Nutzen für Teilnehmende</H2>
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
      </main>
    </>
  );
}
