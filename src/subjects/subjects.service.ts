import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Entity } from 'src/db/enums/entity.enum';
import { UploadService } from 'src/upload/upload.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ConfigService } from '@nestjs/config';
import { MIGRATIONS } from 'src/db/constants/migrations.const';
import { inspect } from 'util';
import { MigrationBase } from 'src/db/interfaces/migration.interface';
import { SerializationService } from 'src/serialization/serialization.service';
import { BaseSubject } from './interfaces/base-subject.interface';

@Injectable()
export class SubjectsService implements OnModuleInit {
  private logger = new Logger('SubjectsService');
  private shouldRunMigrations =
    false || this.configService.get<string>('ENVIRONMENT') === 'production';

  private entity = Entity.SUBJECTS;

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

  async create({ name, img, thumb }: CreateSubjectDto) {
    const currentTimestamp = Date.now();
    const newSubject: BaseSubject = {
      name,
      img,
      thumb,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    const result = await this.dbService.create<BaseSubject>(
      this.entity,
      newSubject,
    );
    return this.serializationService.serializeSubjectResult(result[0]);
  }

  async paginate(startAt: number, limit: number) {
    const results = await this.dbService.paginate<BaseSubject>(
      this.entity,
      startAt,
      limit,
    );
    const data = results.data.map((i) =>
      this.serializationService.serializeSubjectResult(i),
    );
    return { total: results.total, data };
  }

  findAll() {
    return `This action returns all subjcts`;
  }

  async findOne(uid: string) {
    const result = await this.dbService.findOneByUid<BaseSubject>(
      this.entity,
      uid,
    );
    return this.serializationService.serializeSubjectResult(result);
  }

  async search(searchedValue: string) {
    const result = await this.dbService.search<BaseSubject>(
      this.entity,
      'name',
      searchedValue,
    );
    if (!result || !result.length) return [];
    const data = result.map((r) =>
      this.serializationService.serializeSubjectResult(r),
    );
    return data;
  }

  async update(uid: string, { name, img, thumb }: UpdateSubjectDto) {
    // const currentSubject = await this.findOne(uid);

    // if (!currentSubject) {
    //   throw new BadRequestException(`subject with id ${uid} doesn't exist`);
    // }

    // let updatedImg: string | undefined = currentSubject.img;
    // if (img) {
    //   // if (currentSubject.img) {
    //   //   await this.uploadService.deleteFile(currentSubject.img);
    //   // }
    //   updatedImg = img;
    // }

    // let updatedThumb: string | undefined = currentSubject.thumb;
    // if (thumb) {
    //   // if (currentSubject.thumb) {
    //   //   await this.uploadService.deleteFile(currentSubject.thumb);
    //   // }
    //   updatedThumb = thumb;
    // }

    // const updatedName = name || currentSubject.name;

    const currentTimestamp = Date.now();

    const updatedSubject: BaseSubject = {
      name,
      img,
      thumb,
      updatedAt: currentTimestamp,
    };

    const result = await this.dbService.update<BaseSubject>(
      this.entity,
      uid,
      updatedSubject,
    );
    return this.serializationService.serializeSubjectResult(result);
  }

  async remove(uid: string) {
    const toBeDeletedSubject = await this.findOne(uid);
    if (!toBeDeletedSubject) {
      throw new BadRequestException(`Subject with id ${uid} doesn't exist`);
    }
    if (toBeDeletedSubject.img) {
      await this.uploadService.deleteFile(toBeDeletedSubject.img);
    }
    if (toBeDeletedSubject.thumb) {
      await this.uploadService.deleteFile(toBeDeletedSubject.thumb);
    }
    await this.dbService.delete(this.entity, uid);
  }
}
