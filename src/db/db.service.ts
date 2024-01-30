import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Surreal } from 'surrealdb.node';
import { inspect } from 'util';
import { Entity, ExtendedEntity } from './enums/entity.enum';
import { MIGRATIONS } from './constants/migrations.const';
import { MigrationBase } from './interfaces/migration.interface';
import { Relation } from 'src/shared/interfaces/relation.interface';
import { SerializationService } from 'src/serialization/serialization.service';
import {
  Filters,
  SingleValueFilter,
} from 'src/shared/interfaces/filters.interface';
import { FilterType } from 'src/shared/enums/filter-type.enum';

@Injectable()
export class DbService implements OnModuleInit {
  private logger = new Logger('DbService');
  private _db?: Surreal;
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  get db() {
    return this._db;
  }

  constructor(
    private config: ConfigService,
    private configService: ConfigService,
    private serializationService: SerializationService,
  ) {}

  async onModuleInit() {
    this._db = new Surreal();
    await this._connectAndSignIn();
    if (!this.shouldRunMigrations) return;
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      const migrations = MIGRATIONS.get('database');
      if (!migrations.length) return;

      for (const migration of migrations) {
        const foundMigration = await this.findOneWhere(
          'migrations',
          `name = '${migration.name}'`,
        );
        if (foundMigration) continue;
        this.logger.warn(
          `migration ${migration.name} wasn't found in database, running it`,
        );
        const migrationResult = await this.query(migration.query);
        if (!Array.isArray(migrationResult)) {
          this.logger.error(`migration failed ${inspect({ migration })}`);
          continue;
        }
        this.logger.log(
          `migration ${migration.name} succeeded, saving it to database`,
        );
        const currentTimestamp = Date.now();
        const migrationRecord: MigrationBase = {
          ...migration,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        };

        const storedMigrationResult = await this.create(
          'migrations',
          migrationRecord,
        );
        this.logger.log(
          `migration ${migration.name} stored! ${inspect(
            { storedMigrationResult },
            { depth: null },
          )}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `runMigrations error ${inspect({ error }, { depth: null })}`,
      );
    }
  }

  private async _connectAndSignIn() {
    const username = this.config.get<string>('SURREAL_DB_USER');
    const password = this.config.get<string>('SURREAL_DB_PASSWORD');
    const namespace = this.config.get<string>('SURREAL_DB_NS');
    const database = this.config.get<string>('SURREAL_DB_DATABASE');

    this.logger.log('connection to local surreal db', {
      namespace,
      database,
      url: 'ws://127.0.0.1:8000',
    });
    try {
      const result = await this.db.connect('ws://127.0.0.1:8000');
      this.logger.log(
        `connection works: ${inspect({ result }, { depth: null })}`,
      );

      const signInResult = await this.db.signin({
        username,
        password,
        namespace,
        database,
      });

      this.logger.log(
        `db signIn works: ${inspect({ signInResult }, { depth: null })}`,
      );
    } catch (error) {
      this.logger.error(
        '_connectAndSignIn error: ',
        inspect({ error }, { depth: null }),
      );
    }
  }

  private getRelationsSelectors(relations: Relation[]) {
    return relations.map((r) => {
      const selectors =
        r.fields && r.fields.length
          ? r.fields.map((f) => `${r.idCol}.${f}`).join(', ')
          : `${r.idCol}.* `;
      const selectorsWithAlias = selectors + `AS ${r.alias}`;
      return selectorsWithAlias;
    });
  }

  buildWhereConditionFromFilters(filters: Filters[]) {
    let whereCondition = ``;

    filters.forEach((filter, index) => {
      let addedFilter = '';
      if (filter.type === FilterType.SINGLE_VALUE) {
        addedFilter = `${filter.key} = ${filter.value} `;
      }

      if (filter.type === FilterType.RANGE) {
        addedFilter = ` ${filter.key} >= ${filter.from} AND ${filter.key} <= ${filter.to} `;
      }

      if (filter.type === FilterType.MULTIPLE_VALUES) {
        if (filter.condition === 'AND') {
          addedFilter = ` ${filter.key} CONTAINS ${filter.values.join(', ')} `;
        }

        if (filter.condition === 'OR') {
          addedFilter = filter.values
            .map((v) => `${filter.key} = ${v} `)
            .join(' OR ');
        }
      }

      if (filter.type === FilterType.SELECTOR) {
        return;
      }

      whereCondition =
        whereCondition + (index > 0 ? ' AND ' : '') + addedFilter;
    });

    return whereCondition;
  }

  async create<T = any>(entity: ExtendedEntity, data: Record<string, any>) {
    try {
      const created = (await this._db.create(entity, data)) as T[];

      return created;
    } catch (error) {
      this.logger.error(`create error ${inspect({ error }, { depth: null })}`);
      throw new BadRequestException(
        `Couldn't create user ${inspect({ data }, { depth: null })}`,
      );
    }
  }

  async update<T = any>(
    entity: ExtendedEntity,
    uid: string,
    data: Record<string, any>,
  ) {
    try {
      const id = this.serializationService.regularUidToSurrealId(entity, uid);
      const result = (await this._db.merge(id, data)) as T;

      return result as T;
    } catch (error) {
      this.logger.error(
        `update error: ${inspect({ entity, uid, data, error })}`,
      );
    }
  }

  async findOneWithRelationsByUid<T = any>(
    entity: Entity,
    uid: string,
    relations: Relation[],
  ): Promise<T> {
    try {
      const id = this.serializationService.regularUidToSurrealId(entity, uid);

      const relationsSelectors = this.getRelationsSelectors(relations);

      const query = `SELECT *, ${relationsSelectors.join(', ')} FROM ${id}`;
      const data = (await this.query(query)) as T[];
      // console.log('@@@@@', { query, data });

      if (!data || !data.length) return;
      const result = data[0];
      return this.serializationService.serializeRecordAndRelationIds(
        result,
        relations,
      );
    } catch (error) {
      this.logger.error(
        `findOneWithReationsByUid error : ${inspect(
          { error },
          { depth: null },
        )}`,
      );
    }
  }

  async findRandom<T = any>(entity: Entity, filters: Filters[], limit: number) {
    const whereClause = this.buildWhereConditionFromFilters(filters);
    const result = await this.query<T>(
      `SELECT * FROM ${entity} WHERE ${whereClause} ORDER BY rand() DESC LIMIT ${limit};`,
    );

    const data = (result as T[]).length ? (result as T[]) : ([] as T[]);

    return data;
  }

  async findOneByUid<T = any>(entity: Entity, uid: string): Promise<T> {
    try {
      const id = this.serializationService.regularUidToSurrealId(entity, uid);
      const data = (await this._db.select(id)) as T;

      if (!data) return;
      const result = data;
      return result;
    } catch (error) {
      this.logger.error(
        `findOneById error : ${inspect({ error }, { depth: null })}`,
      );
    }
  }

  async findOneWhere<T = any>(
    entity: ExtendedEntity,
    where: string,
  ): Promise<T> {
    try {
      const result = await this.query<T>(
        `SELECT * FROM ${entity} WHERE ${where};`,
      );

      if (!result || !result.length) {
        return;
      }

      if (result.length > 1) {
        this.logger.warn(
          `findOneWhere found more than one record: ${inspect(
            { result },
            { depth: null },
          )}`,
        );
      }

      const [data] = result;

      return data;
    } catch (error) {
      this.logger.error(
        `findOneWhere error: ${inspect({ error }, { depth: null })}`,
      );
      throw new BadRequestException();
    }
  }

  async findWhere<T = any>(
    entity: ExtendedEntity,
    where: string,
  ): Promise<T[]> {
    try {
      const result = await this.query<T>(
        `SELECT * FROM ${entity} WHERE ${where};`,
      );

      if (!result || !result.length) {
        return;
      }

      return result;
    } catch (error) {
      this.logger.error(
        `findWhere error: ${inspect({ error }, { depth: null })}`,
      );
      throw new BadRequestException();
    }
  }

  async count(entity: Entity, filter: SingleValueFilter) {
    const whereClause = this.buildWhereConditionFromFilters([filter]);

    const query = `SELECT count() as total FROM ${entity} WHERE ${whereClause} GROUP ALL;`;

    const results = await this.query<{ total: number }>(query);

    if (!results || !results.length) {
      return { total: 0 };
    }

    return results[0];
  }

  async search<T = any>(
    entity: Entity,
    searchedIndex: string | string[],
    searchedValue: string,
  ): Promise<T[]> {
    try {
      const searchIndex = Array.isArray(searchedIndex)
        ? searchedIndex.join(' OR ')
        : searchedIndex;

      const query = `SELECT *, search::score(1) AS score FROM ${entity} WHERE ${searchIndex} @1@ '${searchedValue}' ORDER BY score DESC`;
      const results = await this.query<T>(query);

      if (!results || !results.length) {
        return;
      }

      return results;
    } catch (error) {
      this.logger.error(`search error: ${inspect({ error }, { depth: null })}`);
      throw new BadRequestException();
    }
  }

  async find<T = any>(entity: Entity) {
    return await this.query<T>(`SELECT * FROM ${entity} `);
  }

  async paginate<T = any>(
    entity: Entity,
    startAt = 0,
    limit = 20,
    filter?: SingleValueFilter,
  ) {
    let filterClause: string;

    if (filter) {
      filterClause = this.buildWhereConditionFromFilters([filter]);
    }
    const [[pagination], result] = await this.query<(T | { total: number })[]>(
      `BEGIN TRANSACTION;
      SELECT count() as total FROM ${entity} ${
        filterClause ? 'WHERE ' + filterClause : ''
      } GROUP ALL;
      SELECT * FROM ${entity} ${
        filterClause ? 'WHERE ' + filterClause : ''
      } ORDER BY updatedAt DESC LIMIT ${limit} START ${startAt};
      COMMIT TRANSACTION;`,
    );

    if (!pagination) return { total: 0, data: [] as T[] };

    const data = (result as T[]).length ? (result as T[]) : ([] as T[]);
    return { total: (pagination as { total: number }).total, data };
  }

  async paginateWithRelations<T = any>(
    entity: Entity,
    startAt = 0,
    limit = 20,
    relations: Relation[],
    filter?: SingleValueFilter,
  ) {
    let filterClause: string;

    if (filter) {
      filterClause = this.buildWhereConditionFromFilters([filter]);
    }

    const relationsSelectors = relations.length
      ? this.getRelationsSelectors(relations)
      : [];
    const query = `BEGIN TRANSACTION;
    SELECT count() as total FROM ${entity} ${
      filterClause ? 'WHERE ' + filterClause : ''
    } GROUP ALL;
    SELECT *, ${
      relationsSelectors.length ? relationsSelectors.join(', ') : ''
    } FROM ${entity} ${
      filterClause ? 'WHERE ' + filterClause : ''
    } ORDER BY updatedAt DESC LIMIT ${limit} START ${startAt};
    COMMIT TRANSACTION;`;

    const [[pagination], result] =
      await this.query<(T | { total: number })[]>(query);

    if (!pagination) return { total: 0, data: [] as T[] };

    const data = (result as T[]).length ? (result as T[]) : ([] as T[]);
    return { total: (pagination as { total: number }).total, data };
  }

  async delete(entity: Entity, uid: string) {
    try {
      const id = this.serializationService.regularUidToSurrealId(entity, uid);
      await this.query(`DELETE ${id}`);
    } catch (error) {
      this.logger.error(`delete error: ${inspect({ entity, uid, error })}`);
    }
  }

  async query<T = any>(query: string): Promise<T[]> {
    try {
      const result = (await this.db.query(query)) as T[];

      return result;
    } catch (error) {
      const err = `query error: ${inspect({ error })}`;
      this.logger.error(err);
      throw new InternalServerErrorException(error);
    }
  }

  async query2<T = any>(query: string): Promise<T> {
    try {
      const result = (await this.db.query(query)) as T;

      return result;
    } catch (error) {
      const err = `query2 error: ${inspect({ error })}`;
      this.logger.error(err);
      throw new InternalServerErrorException(error);
    }
  }
}
