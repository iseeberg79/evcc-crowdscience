import { createFileRoute } from "@tanstack/react-router";

import bundesministerium from "~/assets/images/bundesministerium-fur-wirtschaft-und-klimaschutz-seeklogo.png";
import { H3, P, PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/impressum")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageTitle>Impressum</PageTitle>
      <H3>Herausgeber</H3>
      <P>
        Hochschule für Technik und Wirtschaft (HTW) <br />
        Berlin Fachbereich 1 - Energie und Information <br />
        Wilhelminenhofstraße 75A <br />
        12459 Berlin
      </P>

      <H3>Vertreten durch</H3>
      <P>Prof. Dr.-Ing. habil. Volker Quaschning</P>
      <H3>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV</H3>
      <P>Forschungsgruppe Solarspeichersysteme</P>
      <a
        href="https://solar.htw-berlin.de/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        https://solar.htw-berlin.de/
      </a>
      <H3>Kontakt</H3>
      <P>
        E-Mail:{" "}
        <a
          href="mailto:solar@htw-berlin.de"
          className="underline hover:text-primary"
        >
          solar@htw-berlin.de
        </a>
      </P>
      <H3>Förderung</H3>
      <P>
        Dieses Portal wurde im Forschungsprojekt Wallboxinspektion erstellt mit
        Mitteln des Bundesministeriums für Wirtschaft und Klimaschutz unter dem
        Förderkennzeichen 01MV23027B gefördert. Die Verantwortung für den Inhalt
        dieser Webseite liegt der HTW Berlin.
      </P>
      <div className="flex items-center justify-center py-4">
        <img
          src={bundesministerium}
          alt="Logo des Bundesministeriums für Wirtschaft und Klimaschutz"
          className="w-48"
        />
      </div>
      <P>Impressumsangaben gemäß § 5 Telemediengesetz (TMG)</P>
    </>
  );
}
