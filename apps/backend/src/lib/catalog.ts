import { Book, Partner, Service } from "@/models/catalog";

export type CatalogKind = "services" | "books" | "partners";

export type CatalogConfig = {
  kind: CatalogKind;
  label: string;
  singular: string;
  intro: string;
  titleLabel: string;
  /** Extra fields this kind uses beyond title/description/image/order/status. */
  author: boolean;
  year: boolean;
  link: string | null;
  content: boolean;
  publicPath: string | null;
};

export const CATALOG: Record<CatalogKind, CatalogConfig> = {
  services: {
    kind: "services",
    label: "Services",
    singular: "service",
    intro: "What AILO offers to partners, students and the public. Shown on the Services page.",
    titleLabel: "Service name",
    author: false,
    year: false,
    link: null,
    content: true,
    publicPath: "/services",
  },
  books: {
    kind: "books",
    label: "Books",
    singular: "book",
    intro: "Books and publications from AILO. Shown on the Books page.",
    titleLabel: "Book title",
    author: true,
    year: true,
    link: "Link (where to read or get it)",
    content: false,
    publicPath: "/books",
  },
  partners: {
    kind: "partners",
    label: "Partners",
    singular: "partner",
    intro: "Organisations AILO has worked with. Their logos scroll under the homepage hero, and the chatbot can answer questions about them.",
    titleLabel: "Partner name",
    author: false,
    year: false,
    link: "Website",
    content: false,
    publicPath: null,
  },
};

export function isCatalogKind(value: string): value is CatalogKind {
  return value === "services" || value === "books" || value === "partners";
}

export function catalogModel(kind: CatalogKind) {
  return kind === "services" ? Service : kind === "books" ? Book : Partner;
}
