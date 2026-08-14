export type Vehicle = {
  category: string;
  image: string;
  name: string;
  slug: string;
  specs: {
    battery: null;
    range: null;
    seats: null;
  };
};

export const vehicles: Vehicle[] = [
  {
    category: "Electric saloon",
    image: "/vehicles/cutouts/model-01-v2.png",
    name: "Model 01",
    slug: "model-01",
    specs: { battery: null, range: null, seats: null },
  },
  {
    category: "Electric crossover",
    image: "/vehicles/cutouts/model-02-v2.png",
    name: "Model 02",
    slug: "model-02",
    specs: { battery: null, range: null, seats: null },
  },
  {
    category: "Electric utility",
    image: "/vehicles/cutouts/model-03-v2.png",
    name: "Model 03",
    slug: "model-03",
    specs: { battery: null, range: null, seats: null },
  },
  {
    category: "Electric saloon",
    image: "/vehicles/cutouts/model-04-v2.png",
    name: "Model 04",
    slug: "model-04",
    specs: { battery: null, range: null, seats: null },
  },
];

export function getVehicle(slug: string) {
  return vehicles.find((vehicle) => vehicle.slug === slug);
}
