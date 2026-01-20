export type MeasurementConfig = Record<
  string,
  {
    label: string;
    fields: Record<
      string,
      {
        label: string;
        unit: string;
      }
    >;
  }
>;

export const possibleMeasurementsConfig: MeasurementConfig = {
  battery: {
    label: "Battery",
    fields: {
      power: {
        label: "Power",
        unit: "W",
      },
      soc: {
        label: "SOC",
        unit: "%",
      },
      energy: {
        label: "Energy",
        unit: "Wh",
      },
    },
  },
  grid: {
    label: "Grid",
    fields: {
      power: {
        label: "Power",
        unit: "W",
      },
      energy: {
        label: "Energy",
        unit: "Wh",
      },
    },
  },
  loadpoints: {
    label: "Load Points",
    fields: {
      chargePower: {
        label: "Charge Power",
        unit: "W",
      },
      chargeCurrents: {
        label: "Charge Currents",
        unit: "kW",
      },
      chargeDuration: {
        label: "Charge Duration",
        unit: "seconds",
      },
    },
  },
  pv: {
    label: "PV",
    fields: {
      power: {
        label: "Power",
        unit: "W",
      },
      energy: {
        label: "Energy",
        unit: "Wh",
      },
      excessDCPower: {
        label: "Excess DC Power",
        unit: "W",
      },
    },
  },
  site: {
    label: "Site",
    fields: {},
  },
  vehicles: {
    label: "Vehicles",
    fields: {},
  },
};
