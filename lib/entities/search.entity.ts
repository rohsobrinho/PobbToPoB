import { EntitySchema } from "typeorm";

export type SearchEntity = {
  id: number;
  url: string;
  buildName: string;
};

export const SearchSchema = new EntitySchema<SearchEntity>({
  name: "Search",
  tableName: "searchs",
  schema: "public",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true
    },
    url: {
      type: String,
      name: "url"
    },
    buildName: {
      type: String,
      name: "build_name"
    }
  }
});
