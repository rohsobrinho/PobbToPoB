import { DataSource } from "typeorm";
import { SearchEntity, SearchSchema } from "@/lib/entities/search.entity";

declare global {
  // eslint-disable-next-line no-var
  var __pobbDataSource: DataSource | undefined;
  // eslint-disable-next-line no-var
  var __pobbDataSourcePromise: Promise<DataSource> | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  return databaseUrl;
}

function createDataSource() {
  return new DataSource({
    type: "postgres",
    url: getDatabaseUrl(),
    ssl: {
      rejectUnauthorized: false
    },
    synchronize: false,
    logging: false,
    entities: [SearchSchema]
  });
}

export async function getDataSource() {
  if (global.__pobbDataSource?.isInitialized) {
    return global.__pobbDataSource;
  }

  if (!global.__pobbDataSourcePromise) {
    const dataSource = createDataSource();
    global.__pobbDataSourcePromise = dataSource.initialize().then((initialized) => {
      global.__pobbDataSource = initialized;
      return initialized;
    });
  }

  return global.__pobbDataSourcePromise;
}

export async function saveSearch(url: string, buildName: string) {
  const dataSource = await getDataSource();
  const repository = dataSource.getRepository<SearchEntity>("Search");

  await repository.insert({
    url,
    buildName
  });
}
