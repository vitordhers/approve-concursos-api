import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { DbService } from 'src/db/db.service';
import { Entity } from 'src/db/enums/entity.enum';
import { BaseInstitution } from './interfaces/base-institution.interface';
import { UploadService } from 'src/upload/upload.service';
import { ConfigService } from '@nestjs/config';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { SerializationService } from 'src/serialization/serialization.service';

@Injectable()
export class InstitutionsService implements OnModuleInit {
  private logger = new Logger('InstitutionsService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.INSTITUTIONS;
  constructor(
    private readonly dbService: DbService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly serializationService: SerializationService,
  ) {}

  async onModuleInit() {
    if (!this.shouldRunMigrations) return;
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      const migrations = MIGRATIONS.get(this.entity);
      if (!migrations.length) return;

      for (const migration of migrations) {
        const foundMigration = await this.dbService.findOneWhere(
          'migrations',
          `name = '${migration.name}'`,
        );
        if (foundMigration) continue;
        this.logger.warn(
          `migration ${migration.name} wasn't found in database, running it`,
        );
        const migrationResult = await this.dbService.query(migration.query);
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

        const storedMigrationResult = await this.dbService.create(
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

  async create({ name, img, thumb }: CreateInstitutionDto) {
    const currentTimestamp = Date.now();
    const newInstitution: BaseInstitution = {
      name,
      img,
      thumb,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    const result = await this.dbService.create<BaseInstitution>(
      this.entity,
      newInstitution,
    );
    return this.serializationService.serializeInstitutionResult(result[0]);
  }

  async paginate(startAt: number, limit: number) {
    const results = await this.dbService.paginate<BaseInstitution>(
      this.entity,
      startAt,
      limit,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeInstitutionResult(i),
    );
    return { total: results.total, data };
  }

  findAll() {
    return `This action returns all institutions`;
  }

  async findOne(uid: string) {
    const result = await this.dbService.findOneByUid<BaseInstitution>(
      this.entity,
      uid,
    );
    return this.serializationService.serializeInstitutionResult(result);
  }

  async search(searchedValue: string) {
    const result = await this.dbService.search<BaseInstitution>(
      this.entity,
      'name',
      searchedValue,
    );
    if (!result || !result.length) return [];
    const data = result.map((r) =>
      this.serializationService.serializeInstitutionResult(r),
    );
    return data;
  }

  async update(uid: string, { name, img, thumb }: UpdateInstitutionDto) {
    // const currentInstitution = await this.findOne(uid);

    // if (!currentInstitution) {
    //   throw new BadRequestException(`institution with id ${uid} doesn't exist`);
    // }

    // let updatedImg: string | undefined = currentInstitution.img;
    // if (img) {
    //   // if (currentInstitution.img) {
    //   //   await this.uploadService.deleteFile(currentInstitution.img);
    //   // }
    //   updatedImg = img;
    // }

    // let updatedThumb: string | undefined = currentInstitution.thumb;
    // if (thumb) {
    //   // if (currentInstitution.thumb) {
    //   //   await this.uploadService.deleteFile(currentInstitution.thumb);
    //   // }
    //   updatedThumb = thumb;
    // }

    // const updatedName = name || currentInstitution.name;

    const currentTimestamp = Date.now();

    const updatedInstitution: BaseInstitution = {
      name,
      img,
      thumb,
      updatedAt: currentTimestamp,
    };

    const result = await this.dbService.update<BaseInstitution>(
      this.entity,
      uid,
      updatedInstitution,
    );
    return this.serializationService.serializeInstitutionResult(result);
  }

  async remove(uid: string) {
    const toBeDeletedInstitution = await this.findOne(uid);
    if (!toBeDeletedInstitution) {
      throw new BadRequestException(`Institution with id ${uid} doesn't exist`);
    }
    // if (toBeDeletedInstitution.img) {
    //   await this.uploadService.deleteFile(toBeDeletedInstitution.img);
    // }
    // if (toBeDeletedInstitution.thumb) {
    //   await this.uploadService.deleteFile(toBeDeletedInstitution.thumb);
    // }
    await this.dbService.delete(this.entity, uid);
  }
}
