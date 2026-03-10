import { useState } from "react";
import { AccordionHeader, AccordionTrigger } from "@radix-ui/react-accordion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { differenceInMinutes, format } from "date-fns";
import { PartyPopperIcon } from "lucide-react";
import Confetti from "react-confetti-boom";
import * as z from "zod";

import { CopyableText } from "~/components/copyable-text";
import { PrivacyText } from "~/components/privacy-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "~/components/ui/accordion";
import { Button, LoadingButton } from "~/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Checkbox } from "~/components/ui/checkbox";
import { H3, PageTitle } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import homeassistantInstruction1 from "../../assets/instructions/homeassistant-instruction-1.png";
import homeassistantInstruction2 from "../../assets/instructions/homeassistant-instruction-2.png";
import homeassistantInstruction3 from "../../assets/instructions/homeassistant-instruction-3.png";
import homeassistantInstruction4 from "../../assets/instructions/homeassistant-instruction-4.png";
import linuxInstruction1 from "../../assets/instructions/linux-instruction-1.png";
import linuxInstruction2 from "../../assets/instructions/linux-instruction-2.png";
import linuxInstruction3 from "../../assets/instructions/linux-instruction-3.png";
import linuxInstruction4 from "../../assets/instructions/linux-instruction-4.png";
import mqttInstruction1 from "../../assets/instructions/mqtt-instruction-1.png";
import mqttInstruction2 from "../../assets/instructions/mqtt-instruction-2.png";
import mqttInstruction3 from "../../assets/instructions/mqtt-instruction-3.png";
import mqttInstruction4 from "../../assets/instructions/mqtt-instruction-4.png";

export const Route = createFileRoute("/_public/mitmachen")({
  component: RouteComponent,
  validateSearch: z.object({
    instanceId: z.string().optional(),
    step: z.number().default(1),
  }),
  beforeLoad: ({ search }) => {
    if (search.step === 1 && search.instanceId) {
      throw redirect({
        to: ".",
        search: (prev) => ({ ...prev, step: 2 }),
      });
    }
  },
});

function StepItem({
  step,
  activeStep,
  title,
  children,
  className,
}: {
  step: number;
  activeStep: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItem value={`step-${step}`}>
      <AccordionHeader className="flex">
        <AccordionTrigger className="flex cursor-default items-center gap-2 py-4 font-medium transition-all">
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-colors",
              step <= activeStep && "bg-primary text-primary-foreground",
            )}
          >
            {step}
          </div>
          <span className="">{title}</span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className={cn("flex flex-col gap-2", className)}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { instanceId, step } = Route.useSearch();
  const generateInstanceIdMutation = useMutation(
    orpc.instances.generateId.mutationOptions(),
  );

  const latestInstanceUpdate = useQuery(
    orpc.instances.getLatestUpdate.queryOptions({
      input: { instanceId: instanceId! },
      enabled: Boolean(instanceId) && step > 2,
      select: (data) => {
        if (!data || differenceInMinutes(new Date(), new Date(data)) > 3)
          return undefined;
        return data;
      },
      refetchInterval: 5000,
    }),
  );

  const [isChecked, setIsChecked] = useState(false);
  const [hasBrokerAlready, setHasBrokerAlready] = useState(false);
  const [usesLinux, setUsesLinux] = useState(true);

  return (
    <div className="mx-auto max-w-(--max-content-width)">
      {latestInstanceUpdate.data ? (
        <div className="motion-reduce:hidden">
          <Confetti
            spreadDeg={300}
            launchSpeed={Math.min((window?.innerWidth ?? 0) / 1000, 1)}
            y={0.2}
            particleCount={120}
            shapeSize={Math.min((window?.innerWidth ?? 0) / 30, 20)}
          />
        </div>
      ) : null}
      <PageTitle>Daten spenden</PageTitle>
      <div className="grid grow gap-4 md:grid-cols-2 md:gap-8">
        <div>
          <H3>Schritte</H3>
          <Accordion type="single" className="w-full" value={`step-${step}`}>
            <StepItem step={1} title="Eine ID erhalten" activeStep={step}>
              <p className="leading-loose">
                Um Daten zu spenden,{" "}
                <span className="italic">erhältst du eine ID</span>, die deiner
                evcc-Instanz zugeordnet wird.
              </p>
              <p className="leading-loose">
                Diese ID wird in deinem MQTT-Thema verwendet, um die Daten zu
                markieren, die von deiner Instanz kommen.
              </p>
              <p className="leading-loose">
                Du kannst die ID speichern, um später auf deine analysierten
                Daten zuzugreifen.
              </p>
              <p className="leading-loose">
                Deine Daten werden ausschließlich anonymisiert und für
                wissenschaftliche Zwecke verwendet.
              </p>
              <div className="mb-4 flex items-center">
                <div className="flex space-x-2">
                  <Checkbox
                    id="terms1"
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      setIsChecked(
                        checked === "indeterminate" ? false : checked,
                      )
                    }
                  ></Checkbox>
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms1"
                      className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ich habe die{" "}
                      <Link
                        to="/datenschutz"
                        className="font-bold text-primary underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Datenschutzerklärung
                      </Link>{" "}
                      gelesen und stimme der anonymisierten Verarbeitung meiner
                      Daten zu.
                    </label>
                  </div>
                </div>
              </div>

              <LoadingButton
                onClick={async () => {
                  const instanceIdPair =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({
                    replace: true,
                    search: { instanceId: instanceIdPair.id, step: 2 },
                  });
                }}
                disabled={!isChecked}
                className={`mt-4 w-full rounded-md px-4 py-2`}
              >
                ID erhalten
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title="MQTT-Integration in evcc hinzufügen"
              activeStep={step}
            >
              <p className="leading-loose">
                Hast du bereits einen anderen Broker in evcc eingerichtet?
              </p>

              <div className="my-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasBrokerAlready(false)}
                  className={cn(
                    "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                    !hasBrokerAlready
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  Nein
                </button>
                <button
                  type="button"
                  onClick={() => setHasBrokerAlready(true)}
                  className={cn(
                    "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                    hasBrokerAlready
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  Ja
                </button>
              </div>

              {!hasBrokerAlready ? (
                <div>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li>Öffne deine evcc Web-UI</li>
                    <li>
                      gehe in die Einstellung zu{" "}
                      <span className="font-bold">Konfiguration</span> und
                      aktiviere die{" "}
                      <span className="font-bold">
                        experimentellen UI-Features
                      </span>{" "}
                      (Experimentell: <span className="font-bold">an</span>) im
                      Allgemeinen Teil.
                    </li>
                    <li>
                      Im <span className="font-bold">Integration</span>-Teil
                      unsere MQTT-Integration hinzufügen. <br /> Du musst nur
                      das Thema (das deine ID enthält) und den Broker setzen,{" "}
                      <span className="font-bold">
                        alles andere bleibt leer
                      </span>
                      .
                    </li>
                  </ol>

                  <div className="mb-1 flex flex-wrap items-center gap-y-2">
                    <span className="inline-block w-14 font-semibold">
                      Broker:
                    </span>{" "}
                    <CopyableText
                      text={"wss://mqtt.evcc-crowdscience.de"}
                      language="de"
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-y-2">
                    <span className="inline-block w-14 font-semibold">
                      Thema:
                    </span>{" "}
                    <CopyableText text={`evcc/${instanceId!}`} language="de" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="italic">
                    Damit wir deine Daten erhalten können musst du eine Bridge
                    einrichten, die die evcc-Daten weiterleitet.
                  </p>
                  <p className="leading-loose">
                    Verwendest du evcc unter Linux oder in Home Assistant
                    (Mosquitto Add-on)?
                  </p>

                  <div className="my-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUsesLinux(true)}
                      className={cn(
                        "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                        usesLinux
                          ? "bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      Linux
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsesLinux(false)}
                      className={cn(
                        "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                        !usesLinux
                          ? "bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      Home Assistant
                    </button>
                  </div>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li>
                      Erstelle die Datei{" "}
                      <span className="font-bold">bridge-evcc.conf</span>:
                      <CopyableText
                        className="max-h-18"
                        text={`connection evcc-crowdscience
address mqtt-native.evcc-crowdscience.de:8883

# Optional: lokale Authentifizierung (falls erforderlich)
# local_username <local-username>
# CA-Zertifikatpfad, sorgt für TLS
# bridge_capath /etc/ssl/certs

# Alle lokalen evcc-Topics an das entfernte Präfix weiterleiten
topic # out 1 evcc/ evcc/${instanceId!}/

keepalive_interval 60
restart_timeout 10 30
start_type automatic
cleansession true`}
                        language="de"
                      />
                    </li>
                    {usesLinux ? (
                      <>
                        <li>
                          Falls du nicht das Standardtopic{" "}
                          <span className="font-bold">evcc/</span> verwendest,
                          muss Zeile 10 angepasst werden:
                          <CopyableText
                            text={`topic # out 1 <your-topic> evcc/${instanceId!}/`}
                            language="de"
                          />
                        </li>
                        <li>
                          Datei nach{" "}
                          <span className="font-bold">
                            /etc/mosquitto/conf.d/bridge-evcc.conf
                          </span>{" "}
                          kopieren.
                        </li>
                        <li>
                          Mosquitto neu starten:
                          <CopyableText
                            text={`sudo systemctl restart mosquitto`}
                            language="de"
                          />
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          Falls du nicht das Standardtopic{" "}
                          <span className="font-bold">evcc/</span> verwendest,
                          muss Zeile 10 angepasst werden:
                          <CopyableText
                            text={`topic # out 1 <your-topic> evcc/${instanceId!}/`}
                            language="de"
                          />
                        </li>
                        <li>
                          Datei unter{" "}
                          <span className="font-bold">
                            /share/mosquitto/bridge-evcc.conf
                          </span>{" "}
                          ablegen.
                        </li>

                        <li>
                          Unter Settings → Apps (Add-ons) → Mosquitto broker →
                          Configuration
                          <br />
                          <span className="font-bold">Customize</span> active
                          auf <span className="font-bold">true</span> setzen und
                          als folder{" "}
                          <span className="font-bold">mosquitto</span> angeben
                        </li>
                        <li>
                          Add-On{" "}
                          <span className="font-bold">Mosquitto broker</span>{" "}
                          neu starten.
                        </li>
                      </>
                    )}
                  </ol>
                </div>
              )}
              <p className="leading-loose">
                <span className="italic">
                  Deine Daten werden nicht öffentlich gesendet.
                </span>{" "}
                Die Verbindung ist verschlüsselt und unser MQTT Server ist so
                konfiguriert, dass man ohne Authentifizierung Datenpunkte zu uns
                senden kann. Lesen können diese nur autorisierte Clients.
              </p>

              <div className="flex grow gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId: undefined, step: 1 }}
                    replace
                  >
                    Zurück
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId, step: 3 }}
                    className="grow"
                    replace
                  >
                    MQTT-Integration ist erledigt
                  </Link>
                </Button>
              </div>
            </StepItem>

            <StepItem
              step={3}
              title="evcc neu starten & Verbindung überprüfen"
              activeStep={step}
            >
              <p className="leading-loose italic">
                Wenn du das noch nicht getan hast:{" "}
                <span className="font-bold">
                  starte deinen evcc-Server jetzt neu
                </span>
                .
              </p>
              <p className="leading-loose">
                Deine Daten sollten in kürze ankommen! Wenn du innerhalb einer
                Minute keine Daten siehst, gehe zurück und überprüfe, ob deine
                MQTT-Integration korrekt ist.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId, step: 2 }}
                    replace
                  >
                    Zurück
                  </Link>
                </Button>

                <LoadingButton
                  loading={!latestInstanceUpdate.data}
                  onClick={() => {
                    void navigate({
                      replace: true,
                      search: { instanceId, step: 4 },
                    });
                  }}
                  className="grow"
                >
                  {latestInstanceUpdate.data ? "Weiter" : "Warte auf Daten..."}
                </LoadingButton>
              </div>
            </StepItem>
            <StepItem step={4} title="Daten ansehen" activeStep={step}>
              <p className="leading-loose">
                Daten mit deiner Instance-ID wurden empfangen!
              </p>
              <p className="leading-loose">
                Du kannst nun die Übersicht deiner Daten ansehen. Speichere dir
                den Link oder deine Instance-ID, um dir später
                Analyse-Ergebnisse anzusehen.
              </p>
              <Button asChild>
                <Link
                  to="/view-data/$instanceId"
                  params={{ instanceId: instanceId! }}
                >
                  Daten ansehen
                </Link>
              </Button>
            </StepItem>
          </Accordion>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
          <VisualStepInstruction
            step={step}
            lastInstanceUpdate={latestInstanceUpdate.data}
            hasBrokerAlready={hasBrokerAlready}
            usesLinux={usesLinux}
          />
        </div>
      </div>
    </div>
  );
}

function VisualStepInstruction({
  step,
  lastInstanceUpdate,
  hasBrokerAlready,
  usesLinux,
}: {
  step: number;
  lastInstanceUpdate?: number | null;
  hasBrokerAlready: boolean;
  usesLinux: boolean;
}) {
  if (step === 1)
    return (
      <div className="max-h-[70vh] min-h-[60vh] overflow-auto">
        <PrivacyText />
      </div>
    );
  if (step === 2)
    return (
      <div className="relative flex max-h-[70vh] min-h-72 w-full flex-col items-center gap-4">
        <H3>Anleitung</H3>
        <Carousel className="relative w-full">
          {hasBrokerAlready ? (
            usesLinux ? (
              <CarouselContent>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction1}
                    alt="Linux: bridge-evcc.conf erstellen"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction2}
                    alt="Linux: Text in bridge-evcc.conf einfügen"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction3}
                    alt="Linux: Datei nach /etc/mosquitto/conf.d/ kopieren"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction4}
                    alt="Linux: Mosquitto neu starten"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
              </CarouselContent>
            ) : (
              <CarouselContent>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction1}
                    alt="Gehe in die Apps Einstellungen"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction2}
                    alt="Klicke auf Mosquitto broker"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction3}
                    alt="Klicke auf Konfiguration"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction4}
                    alt="Aktiviere Customize und speichere"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
              </CarouselContent>
            )
          ) : (
            <CarouselContent>
              <CarouselItem className="flex items-center justify-center">
                <img
                  src={mqttInstruction1}
                  alt="Gehe in die EVCC Einstellungen"
                  className="max-h-[50vh] rounded-lg object-contain"
                />
              </CarouselItem>
              <CarouselItem className="flex items-center justify-center">
                <img
                  src={mqttInstruction2}
                  alt="Aktiviere experimentelle Features"
                  className="max-h-[50vh] rounded-lg object-contain"
                />
              </CarouselItem>
              <CarouselItem className="flex items-center justify-center">
                <img
                  src={mqttInstruction3}
                  alt="Erstelle eine neue MQTT Integration"
                  className="max-h-[50vh] rounded-lg object-contain"
                />
              </CarouselItem>
              <CarouselItem className="flex items-center justify-center">
                <img
                  src={mqttInstruction4}
                  alt="Thema und Broker setzen"
                  className="max-h-[50vh] rounded-lg object-contain"
                />
              </CarouselItem>
            </CarouselContent>
          )}
          <CarouselPrevious className="absolute top-1/2 left-4 z-10 -translate-y-1/2 transform" />
          <CarouselNext className="absolute top-1/2 right-4 z-10 -translate-y-1/2 transform" />
        </Carousel>
      </div>
    );
  if (step === 3 && !lastInstanceUpdate)
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <H3>Warte auf Daten...</H3>
        <div className="size-12 animate-pulse rounded-full bg-primary"></div>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <H3 className="flex items-center gap-2">
        Verbindung hergestellt <PartyPopperIcon />
      </H3>
      <p>Danke für deine Mitarbeit!</p>
      {lastInstanceUpdate ? (
        <p>
          Letzte empfangene Daten am:{" "}
          {format(new Date(lastInstanceUpdate), "PPpp")}
        </p>
      ) : null}
    </div>
  );
}
