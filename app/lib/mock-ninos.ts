/**
 * Datos de ejemplo para la maqueta de Niños y del perfil del niño.
 *
 * No hay persistencia ni capa de datos: la lista y el perfil leen de este
 * mismo módulo. Los textos y contadores son los de
 * `references/pantallas/ninos.dc.html` y `perfil-nino.dc.html`.
 */

export type AvatarTone = "sky" | "pink" | "mint" | "sand" | "lilac";

export type ChipNino = {
  /** "MANÍ" | "LACTOSA" | "VINCULAR" */
  label: string;
  tone: "alergia" | "pendiente";
};

export type Padre = {
  id: string;
  nombre: string;
  inicial: string;
  /** "Mamá" | "Papá" */
  vinculo: string;
  estado: "activa" | "pendiente";
  avatarTone: AvatarTone;
};

export type Nino = {
  /** kebab-case: "mateo-fernandez" */
  id: string;
  nombre: string;
  inicial: string;
  /** "3 años": se muestra tal cual, no se calcula. */
  edad: string;
  sala: string;
  padresVinculados: number;
  avatarTone: AvatarTone;
  chip?: ChipNino;
  nacimiento: string;
  ingreso: string;
  notas?: { titulo: string; texto: string };
  padres: Padre[];
};

export const ninos: Nino[] = [
  {
    id: "mateo-fernandez",
    nombre: "Mateo Fernández",
    inicial: "M",
    edad: "3 años",
    sala: "Soles",
    padresVinculados: 2,
    avatarTone: "sky",
    chip: { label: "MANÍ", tone: "alergia" },
    nacimiento: "12 mar 2022",
    ingreso: "feb 2025",
    notas: {
      titulo: "Alergias y notas",
      texto:
        "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    },
    padres: [
      {
        id: "lucia-fernandez",
        nombre: "Lucía Fernández",
        inicial: "L",
        vinculo: "Mamá",
        estado: "activa",
        avatarTone: "lilac",
      },
      {
        id: "diego-fernandez",
        nombre: "Diego Fernández",
        inicial: "D",
        vinculo: "Papá",
        estado: "pendiente",
        avatarTone: "sky",
      },
    ],
  },
  {
    id: "sofia-mendez",
    nombre: "Sofía Méndez",
    inicial: "S",
    edad: "2 años",
    sala: "Soles",
    padresVinculados: 1,
    avatarTone: "pink",
    nacimiento: "8 jul 2023",
    ingreso: "mar 2025",
    padres: [
      {
        id: "carla-mendez",
        nombre: "Carla Méndez",
        inicial: "C",
        vinculo: "Mamá",
        estado: "activa",
        avatarTone: "mint",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    nombre: "Benjamín Ruiz",
    inicial: "B",
    edad: "3 años",
    sala: "Soles",
    padresVinculados: 2,
    avatarTone: "mint",
    nacimiento: "22 ene 2022",
    ingreso: "feb 2024",
    padres: [
      {
        id: "andres-ruiz",
        nombre: "Andrés Ruiz",
        inicial: "A",
        vinculo: "Papá",
        estado: "activa",
        avatarTone: "sky",
      },
      {
        id: "paula-ruiz",
        nombre: "Paula Ruiz",
        inicial: "P",
        vinculo: "Mamá",
        estado: "activa",
        avatarTone: "pink",
      },
    ],
  },
  {
    id: "valentina-soto",
    nombre: "Valentina Soto",
    inicial: "V",
    edad: "2 años",
    sala: "Soles",
    padresVinculados: 0,
    avatarTone: "sand",
    chip: { label: "VINCULAR", tone: "pendiente" },
    nacimiento: "3 nov 2023",
    ingreso: "mar 2025",
    padres: [],
  },
  {
    id: "tomas-diaz",
    nombre: "Tomás Díaz",
    inicial: "T",
    edad: "3 años",
    sala: "Soles",
    padresVinculados: 1,
    avatarTone: "lilac",
    chip: { label: "LACTOSA", tone: "alergia" },
    nacimiento: "17 may 2022",
    ingreso: "feb 2025",
    padres: [
      {
        id: "mariano-diaz",
        nombre: "Mariano Díaz",
        inicial: "M",
        vinculo: "Papá",
        estado: "activa",
        avatarTone: "sand",
      },
    ],
  },
  {
    id: "emma-castro",
    nombre: "Emma Castro",
    inicial: "E",
    edad: "2 años",
    sala: "Soles",
    padresVinculados: 1,
    avatarTone: "pink",
    nacimiento: "29 sep 2023",
    ingreso: "mar 2025",
    padres: [
      {
        id: "lucia-castro",
        nombre: "Lucía Castro",
        inicial: "L",
        vinculo: "Mamá",
        estado: "activa",
        avatarTone: "lilac",
      },
    ],
  },
  {
    id: "lucas-romero",
    nombre: "Lucas Romero",
    inicial: "L",
    edad: "3 años",
    sala: "Soles",
    padresVinculados: 1,
    avatarTone: "sky",
    nacimiento: "11 abr 2022",
    ingreso: "ene 2025",
    padres: [
      {
        id: "javier-romero",
        nombre: "Javier Romero",
        inicial: "J",
        vinculo: "Papá",
        estado: "activa",
        avatarTone: "mint",
      },
    ],
  },
  {
    id: "olivia-vega",
    nombre: "Olivia Vega",
    inicial: "O",
    edad: "2 años",
    sala: "Soles",
    padresVinculados: 1,
    avatarTone: "mint",
    nacimiento: "6 dic 2023",
    ingreso: "mar 2025",
    padres: [
      {
        id: "nadia-vega",
        nombre: "Nadia Vega",
        inicial: "N",
        vinculo: "Mamá",
        estado: "activa",
        avatarTone: "sand",
      },
    ],
  },
];

/** Devuelve el niño con ese id o `undefined` si no existe. */
export function getNino(id: string): Nino | undefined {
  return ninos.find((nino) => nino.id === id);
}
